import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { JobVacancyBar } from './components/JobVacancyBar';
import { JobVacancyModal } from './components/JobVacancyModal';
import { ResumeUploadSection } from './components/ResumeUploadSection';
import { CandidateLeaderboard } from './components/CandidateLeaderboard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { CompareModal } from './components/CompareModal';
import { ExportModal } from './components/ExportModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { BulkEmailModal } from './components/BulkEmailModal';
import { LiveSystemGuideModal } from './components/LiveSystemGuideModal';
import { ShareModal } from './components/ShareModal';
import { JobDescription, CandidateResult, ShortlistStatus, EmailDispatchRecord } from './types';
import { INITIAL_VACANCIES } from './data/sampleData';
import { RefreshCw, Layers, CheckCircle2, Mail } from 'lucide-react';

export default function App() {
  const [vacancies, setVacancies] = useState<JobDescription[]>(INITIAL_VACANCIES);
  const [currentVacancy, setCurrentVacancy] = useState<JobDescription>(INITIAL_VACANCIES[0]);
  // Purely clean state: no fake candidate data
  const [allCandidatesMap, setAllCandidatesMap] = useState<Record<string, CandidateResult[]>>({});
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);

  // Modals & UI State
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [vacancyToEdit, setVacancyToEdit] = useState<JobDescription | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [reScreening, setReScreening] = useState(false);

  // Email shooting states
  const [emailCandidate, setEmailCandidate] = useState<CandidateResult | null>(null);
  const [emailType, setEmailType] = useState<'shortlist' | 'rejection'>('shortlist');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Bulk email shooting states
  const [bulkEmailCandidates, setBulkEmailCandidates] = useState<CandidateResult[]>([]);
  const [bulkEmailType, setBulkEmailType] = useState<'shortlist' | 'rejection'>('shortlist');
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);

  // Notification Toast state
  const [emailNotificationToast, setEmailNotificationToast] = useState<{
    message: string;
    type: 'shortlist' | 'rejection';
  } | null>(null);

  // Check backend health and load vacancies from backend repository on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => console.log('Backend health check info:', err));

    fetch('/api/vacancies')
      .then((res) => res.json())
      .then((data) => {
        if (data.vacancies && Array.isArray(data.vacancies) && data.vacancies.length > 0) {
          setVacancies(data.vacancies);
          const firstActive = data.vacancies.find((v: JobDescription) => v.status !== 'archived');
          if (firstActive) {
            setCurrentVacancy(firstActive);
          } else {
            setCurrentVacancy(data.vacancies[0]);
          }
        }
      })
      .catch((err) => console.log('Vacancies fetch info:', err));
  }, []);

  // Map of candidate counts per vacancy
  const candidatesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    vacancies.forEach((v) => {
      map[v.id] = (allCandidatesMap[v.id] || []).length;
    });
    return map;
  }, [vacancies, allCandidatesMap]);

  // Sync candidates when currentVacancy changes
  const handleSelectVacancy = (vacancy: JobDescription) => {
    setCurrentVacancy(vacancy);
    const existing = allCandidatesMap[vacancy.id] || [];
    setCandidates(existing);
    setSelectedForCompare([]);
  };

  // Add newly parsed & evaluated candidates from real uploads
  const handleCandidatesAdded = (newCandidates: CandidateResult[]) => {
    setCandidates((prev) => {
      const updated = [...newCandidates, ...prev.filter((p) => !newCandidates.some((n) => n.id === p.id))];
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });
  };

  // Re-screen real candidate pool against the current vacancy's dedicated criteria
  const handleReScreenCandidatesFromOtherVacancy = async (sourceVacancyId: string) => {
    const sourceCandidates = allCandidatesMap[sourceVacancyId] || [];
    if (sourceCandidates.length === 0) return;

    setReScreening(true);
    setIsProcessing(true);

    try {
      const reEvaluated: CandidateResult[] = [];
      for (const cand of sourceCandidates) {
        const payload = {
          jobDescription: currentVacancy,
          candidateId: `cand-rescreen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          resumeContent: {
            type: 'text',
            fileName: cand.fileName,
            textData: `${cand.candidateName}\n${cand.currentTitle}\n${cand.totalExperienceYears} years experience\nSkills: ${cand.skillsFound.join(', ')}\nEducation: ${cand.educationSummary || ''}`,
          },
        };

        const res = await fetch('/api/parse-match-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          reEvaluated.push({
            ...data,
            dedicatedVacancyId: currentVacancy.id,
            folderName: cand.folderName || 'Re-screened Pool',
            shortlistStatus: data.matchScore >= 80 ? 'shortlisted' : data.matchScore >= 60 ? 'review' : 'rejected',
          });
        }
      }

      if (reEvaluated.length > 0) {
        setCandidates(reEvaluated);
        setAllCandidatesMap((map) => ({
          ...map,
          [currentVacancy.id]: reEvaluated,
        }));
      }
    } catch (err) {
      console.error('Re-screen error:', err);
    } finally {
      setReScreening(false);
      setIsProcessing(false);
    }
  };

  // Update candidate status
  const handleUpdateCandidateStatus = (candidateId: string, status: ShortlistStatus, notes?: string) => {
    setCandidates((prev) => {
      const updated = prev.map((c) =>
        c.id === candidateId
          ? { ...c, shortlistStatus: status, ...(notes !== undefined ? { hrNotes: notes } : {}) }
          : c
      );
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate((prev) =>
        prev
          ? { ...prev, shortlistStatus: status, ...(notes !== undefined ? { hrNotes: notes } : {}) }
          : null
      );
    }
  };

  // Amend Candidate Details in real time
  const handleUpdateCandidate = (updatedCandidate: CandidateResult) => {
    setCandidates((prev) => {
      const updated = prev.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c));
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });

    setSelectedCandidate(updatedCandidate);

    setEmailNotificationToast({
      message: `Amended details for ${updatedCandidate.candidateName}`,
      type: 'shortlist',
    });
    setTimeout(() => setEmailNotificationToast(null), 3000);
  };

  // Single Candidate Shoot Email Trigger
  const handleOpenShootEmail = (candidate: CandidateResult, type: 'shortlist' | 'rejection') => {
    setEmailCandidate(candidate);
    setEmailType(type);
    setIsEmailModalOpen(true);
  };

  // Bulk Candidate Shoot Email Trigger
  const handleOpenShootBulkEmail = (selectedCandidates: CandidateResult[], type: 'shortlist' | 'rejection') => {
    setBulkEmailCandidates(selectedCandidates);
    setBulkEmailType(type);
    setIsBulkEmailModalOpen(true);
  };

  // When a single email is dispatched
  const handleEmailSent = (
    candidateId: string,
    status: ShortlistStatus,
    emailDetails: {
      toEmail: string;
      subject: string;
      body: string;
      type: 'shortlist' | 'rejection';
    }
  ) => {
    const sentRecord: EmailDispatchRecord = {
      id: `disp_${Date.now()}`,
      candidateId,
      candidateName: emailCandidate?.candidateName || 'Candidate',
      toEmail: emailDetails.toEmail,
      type: emailDetails.type,
      subject: emailDetails.subject,
      body: emailDetails.body,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    setCandidates((prev) => {
      const updated = prev.map((c) => {
        if (c.id === candidateId) {
          return {
            ...c,
            shortlistStatus: status,
            emailSentAt: new Date().toISOString(),
            lastEmailType: emailDetails.type,
            emailHistory: [...(c.emailHistory || []), sentRecord],
          };
        }
        return c;
      });
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate((prev) =>
        prev
          ? {
              ...prev,
              shortlistStatus: status,
              emailSentAt: new Date().toISOString(),
              lastEmailType: emailDetails.type,
              emailHistory: [...(prev.emailHistory || []), sentRecord],
            }
          : null
      );
    }

    setEmailNotificationToast({
      message: `Dispatched ${emailDetails.type === 'shortlist' ? 'Shortlist' : 'Rejection'} email to ${emailDetails.toEmail}`,
      type: emailDetails.type,
    });
    setTimeout(() => setEmailNotificationToast(null), 4000);
  };

  // When bulk emails are dispatched
  const handleBulkEmailSent = (
    candidateIds: string[],
    status: ShortlistStatus,
    emailDetails: {
      subject: string;
      templateBody: string;
      type: 'shortlist' | 'rejection';
    }
  ) => {
    const timestamp = new Date().toISOString();

    setCandidates((prev) => {
      const updated = prev.map((c) => {
        if (candidateIds.includes(c.id)) {
          return {
            ...c,
            shortlistStatus: status,
            emailSentAt: timestamp,
            lastEmailType: emailDetails.type,
          };
        }
        return c;
      });
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });

    setEmailNotificationToast({
      message: `Successfully shot ${candidateIds.length} bulk ${emailDetails.type === 'shortlist' ? 'Shortlist' : 'Rejection'} emails!`,
      type: emailDetails.type,
    });
    setTimeout(() => setEmailNotificationToast(null), 4000);
  };

  // Save new or updated vacancy to frontend & backend
  const handleSaveVacancy = (savedVacancy: JobDescription) => {
    const vacancyToSave = {
      ...savedVacancy,
      status: savedVacancy.status || 'active',
    };

    // Sync with backend repository
    fetch('/api/vacancies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacancyToSave),
    }).catch((err) => console.log('Vacancy backend sync info:', err));

    const exists = vacancies.some((v) => v.id === vacancyToSave.id);
    if (exists) {
      setVacancies((prev) => prev.map((v) => (v.id === vacancyToSave.id ? vacancyToSave : v)));
    } else {
      setVacancies((prev) => [vacancyToSave, ...prev]);
    }
    setCurrentVacancy(vacancyToSave);

    // If new vacancy, initialize clean dedicated candidate pool
    if (!allCandidatesMap[vacancyToSave.id]) {
      setAllCandidatesMap((map) => ({
        ...map,
        [vacancyToSave.id]: [],
      }));
      setCandidates([]);
    }
  };

  // Archive vacancy: remove from active board but safely keep in backend repository
  const handleArchiveVacancy = async (vacancyId: string) => {
    const target = vacancies.find((v) => v.id === vacancyId);
    if (!target) return;

    try {
      await fetch(`/api/vacancies/${vacancyId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Backend archive notice:', err);
    }

    const updated = vacancies.map((v) =>
      v.id === vacancyId
        ? {
            ...v,
            status: 'archived' as const,
            archivedAt: new Date().toISOString(),
          }
        : v
    );
    setVacancies(updated);

    // If current selected vacancy was archived, shift active selection to next available active vacancy
    if (currentVacancy.id === vacancyId) {
      const remainingActive = updated.filter((v) => v.id !== vacancyId && v.status !== 'archived');
      if (remainingActive.length > 0) {
        handleSelectVacancy(remainingActive[0]);
      } else {
        const archivedTarget = updated.find((v) => v.id === vacancyId);
        if (archivedTarget) handleSelectVacancy(archivedTarget);
      }
    }

    setEmailNotificationToast({
      message: `"${target.title}" moved to backend archive. Retained for future screening.`,
      type: 'shortlist',
    });
    setTimeout(() => setEmailNotificationToast(null), 4000);
  };

  // Reactivate archived vacancy back to active pipeline
  const handleReactivateVacancy = async (vacancyId: string) => {
    const target = vacancies.find((v) => v.id === vacancyId);
    if (!target) return;

    try {
      await fetch(`/api/vacancies/${vacancyId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Backend reactivate notice:', err);
    }

    const updated = vacancies.map((v) =>
      v.id === vacancyId ? { ...v, status: 'active' as const, archivedAt: undefined } : v
    );
    setVacancies(updated);

    const reactivatedTarget = updated.find((v) => v.id === vacancyId);
    if (reactivatedTarget) {
      handleSelectVacancy(reactivatedTarget);
    }

    setEmailNotificationToast({
      message: `"${target.title}" reactivated to active hiring pipeline!`,
      type: 'shortlist',
    });
    setTimeout(() => setEmailNotificationToast(null), 4000);
  };

  // Delete vacancy profile permanently
  const handleDeleteVacancy = (vacancyId: string) => {
    fetch(`/api/vacancies/${vacancyId}`, { method: 'DELETE' }).catch((err) =>
      console.log('Vacancy delete sync info:', err)
    );
    const remaining = vacancies.filter((v) => v.id !== vacancyId);
    setVacancies(remaining);
    if (currentVacancy.id === vacancyId && remaining.length > 0) {
      handleSelectVacancy(remaining[0]);
    }
    setAllCandidatesMap((map) => {
      const copy = { ...map };
      delete copy[vacancyId];
      return copy;
    });
  };

  // Compare selection toggle
  const handleToggleCompare = (candidateId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), candidateId];
      }
      return [...prev, candidateId];
    });
  };

  // Delete individual candidate
  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates((prev) => {
      const updated = prev.filter((c) => c.id !== candidateId);
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: updated,
      }));
      return updated;
    });
    setSelectedForCompare((prev) => prev.filter((id) => id !== candidateId));
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(null);
    }
  };

  // Clear all screening results for current vacancy
  const handleClearAllCandidates = () => {
    if (
      window.confirm(
        `Are you sure you want to clear all ${candidates.length} screening results for "${currentVacancy.title}"?`
      )
    ) {
      setCandidates([]);
      setAllCandidatesMap((map) => ({
        ...map,
        [currentVacancy.id]: [],
      }));
      setSelectedForCompare([]);
    }
  };

  // Delete bulk selected candidates
  const handleDeleteBulkCandidates = (candidateIds: string[]) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${candidateIds.length} candidate(s) from screening results?`
      )
    ) {
      setCandidates((prev) => {
        const updated = prev.filter((c) => !candidateIds.includes(c.id));
        setAllCandidatesMap((map) => ({
          ...map,
          [currentVacancy.id]: updated,
        }));
        return updated;
      });
      setSelectedForCompare((prev) => prev.filter((id) => !candidateIds.includes(id)));
    }
  };

  // Check if any other vacancy has candidates to offer cross-screening
  const otherVacancyWithCandidates = useMemo(() => {
    if (candidates.length > 0) return null;
    return vacancies.find((v) => v.id !== currentVacancy.id && (allCandidatesMap[v.id] || []).length > 0);
  }, [candidates.length, vacancies, currentVacancy.id, allCandidatesMap]);

  const uploadSectionRef = React.useRef<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d2e5f9] via-[#deedf9] to-[#d6e8fa] text-slate-900 flex flex-col font-['Inter'] relative overflow-x-hidden">
      {/* Soft Ambient Background Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[450px] bg-indigo-300/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <Header
        candidates={candidates}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        hasApiKey={hasApiKey}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Vacancy Requirement Card & Dedicated Profiles Tabs */}
        <JobVacancyBar
          vacancies={vacancies}
          currentVacancy={currentVacancy}
          candidatesCountMap={candidatesCountMap}
          candidates={candidates}
          allCandidatesMap={allCandidatesMap}
          onSelectVacancy={handleSelectVacancy}
          onEditVacancy={() => {
            setVacancyToEdit(currentVacancy);
            setIsVacancyModalOpen(true);
          }}
          onOpenNewVacancy={() => {
            setVacancyToEdit(null);
            setIsVacancyModalOpen(true);
          }}
          onArchiveVacancy={handleArchiveVacancy}
          onReactivateVacancy={handleReactivateVacancy}
          onDeleteVacancy={handleDeleteVacancy}
          onTriggerUploadForVacancy={(v) => {
            handleSelectVacancy(v);
            setTimeout(() => {
              document.getElementById('upload-screening-section')?.scrollIntoView({ behavior: 'smooth' });
              uploadSectionRef.current?.triggerFolderUpload();
            }, 50);
          }}
        />

        {/* Cross-screening Banner for empty vacancies */}
        {otherVacancyWithCandidates && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900">
                  Screen candidates from "{otherVacancyWithCandidates.title}"
                </span>
                <p className="text-slate-600 mt-0.5">
                  You have {allCandidatesMap[otherVacancyWithCandidates.id]?.length} candidate CVs uploaded in "{otherVacancyWithCandidates.title}". Would you like to screen them against this job profile as well?
                </p>
              </div>
            </div>

            <button
              onClick={() => handleReScreenCandidatesFromOtherVacancy(otherVacancyWithCandidates.id)}
              disabled={reScreening || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reScreening ? 'animate-spin' : ''}`} />
              <span>{reScreening ? 'Re-scoring for this profile...' : 'Screen Those CVs for This Job'}</span>
            </button>
          </div>
        )}

        {/* Dedicated Upload & Screening Ingestion Section */}
        <ResumeUploadSection
          ref={uploadSectionRef}
          currentVacancy={currentVacancy}
          vacancies={vacancies}
          onSelectVacancy={handleSelectVacancy}
          onOpenNewVacancy={() => {
            setVacancyToEdit(null);
            setIsVacancyModalOpen(true);
          }}
          onCandidatesAdded={handleCandidatesAdded}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />

        {/* Candidate Leaderboard & Requirement Audit - Displayed only when candidates are uploaded/screened */}
        {candidates.length > 0 && (
          <CandidateLeaderboard
            candidates={candidates}
            currentVacancy={currentVacancy}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            onUpdateCandidateStatus={handleUpdateCandidateStatus}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onOpenCompare={() => setIsCompareModalOpen(true)}
            onDeleteCandidate={handleDeleteCandidate}
            onClearAllCandidates={handleClearAllCandidates}
            onDeleteBulkCandidates={handleDeleteBulkCandidates}
            onShootEmail={handleOpenShootEmail}
            onShootBulkEmail={handleOpenShootBulkEmail}
          />
        )}
      </main>

      {/* Floating Notification Toast */}
      {emailNotificationToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-slideUp">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              emailNotificationToast.type === 'shortlist' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">{emailNotificationToast.message}</div>
            <div className="text-[10px] text-slate-400">Recruiter Dispatch Pipeline Updated</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-blue-200/80 bg-white/85 backdrop-blur-md py-6 text-center text-xs text-slate-600 mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active Candidate Screening for <strong className="text-slate-800">{currentVacancy.title}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-bold text-slate-800">Ipath Talent Match</span>
            <span>•</span>
            <a
              href="https://ipathinfotech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors"
            >
              iPath Infotech (ipathinfotech.com)
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <JobVacancyModal
        isOpen={isVacancyModalOpen}
        onClose={() => setIsVacancyModalOpen(false)}
        onSaveVacancy={handleSaveVacancy}
        vacancyToEdit={vacancyToEdit}
      />

      <CandidateDetailModal
        candidate={selectedCandidate}
        currentVacancy={currentVacancy}
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        onUpdateStatus={handleUpdateCandidateStatus}
        onUpdateCandidate={handleUpdateCandidate}
        onDeleteCandidate={handleDeleteCandidate}
        onShootEmail={handleOpenShootEmail}
      />

      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        candidateIds={selectedForCompare}
        allCandidates={candidates}
        currentVacancy={currentVacancy}
        onSelectCandidate={(c) => {
          setIsCompareModalOpen(false);
          setSelectedCandidate(c);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        candidates={candidates}
        currentVacancy={currentVacancy}
      />

      {/* Single Candidate Shoot Email Modal */}
      <EmailDispatchModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        candidate={emailCandidate}
        currentVacancy={currentVacancy}
        emailType={emailType}
        onEmailSent={handleEmailSent}
      />

      {/* Bulk Candidates Shoot Email Modal */}
      <BulkEmailModal
        isOpen={isBulkEmailModalOpen}
        onClose={() => setIsBulkEmailModalOpen(false)}
        selectedCandidates={bulkEmailCandidates}
        currentVacancy={currentVacancy}
        emailType={bulkEmailType}
        onBulkEmailSent={handleBulkEmailSent}
      />

      {/* Live System Guide & API Architecture Modal */}
      <LiveSystemGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Share & HR Testing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
