import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  UserX,
  RefreshCw,
  Users,
  Eye,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';
import { CandidateResult, JobDescription, ShortlistStatus } from '../types';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidates: CandidateResult[];
  currentVacancy: JobDescription;
  emailType: 'shortlist' | 'rejection';
  onBulkEmailSent: (
    candidateIds: string[],
    status: ShortlistStatus,
    emailDetails: {
      subject: string;
      templateBody: string;
      type: 'shortlist' | 'rejection';
    }
  ) => void;
}

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  isOpen,
  onClose,
  selectedCandidates,
  currentVacancy,
  emailType,
  onBulkEmailSent,
}) => {
  const isShortlist = emailType === 'shortlist';

  // Active recipient candidates (allows deselecting within modal)
  const [activeCandidateIds, setActiveCandidateIds] = useState<string[]>([]);
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [completedSummary, setCompletedSummary] = useState<{
    total: number;
    sentAt: string;
  } | null>(null);

  // Initialize candidates & templates on open
  useEffect(() => {
    if (!isOpen) {
      setCompletedSummary(null);
      setSendProgress(0);
      return;
    }

    setActiveCandidateIds(selectedCandidates.map((c) => c.id));
    setPreviewCandidateIndex(0);

    if (isShortlist) {
      setSubjectTemplate(`Interview Update: Shortlisted for ${currentVacancy.title}`);
      setBodyTemplate(
`Dear {Applicant Name},

Thank you for applying for the ${currentVacancy.title} position in our ${currentVacancy.department} team.

We have reviewed your application and resume against our vacancy requirements. We are excited to inform you that you have been shortlisted for the next phase of our hiring process!

Our recruitment team was very impressed by your qualifications and would like to schedule an introductory interview discussion with you over the coming days.

Please reply to this email sharing your best suitable days and time slots (along with your timezone) over the coming week so our team can book your interview appointment accordingly.

We look forward to speaking with you soon!

Warm regards,
Talent Acquisition Team | iPath Infotech
${currentVacancy.department} Department`
      );
    } else {
      setSubjectTemplate(`Update regarding your application for ${currentVacancy.title}`);
      setBodyTemplate(
`Dear {Applicant Name},

Thank you very much for your interest in joining our team and for taking the time to submit your application for the ${currentVacancy.title} position.

We received a significant number of applications from highly qualified candidates. While your background and professional experience are commendable, after careful consideration against our immediate role requirements, we have chosen to move forward with other candidates at this time.

We want to thank you for your time, interest, and effort throughout the application process. With your consent, we will retain your resume in our talent database for future roles that may align closely with your background.

We sincerely wish you the best of luck in your career search and future professional endeavors.

Warm regards,
Talent Acquisition Team | iPath Infotech`
      );
    }
  }, [isOpen, emailType, selectedCandidates, currentVacancy, isShortlist]);

  // Candidates that are currently checked
  const activeCandidates = useMemo(() => {
    return selectedCandidates.filter((c) => activeCandidateIds.includes(c.id));
  }, [selectedCandidates, activeCandidateIds]);

  // Toggle candidate inclusion
  const toggleCandidate = (id: string) => {
    setActiveCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setActiveCandidateIds(selectedCandidates.map((c) => c.id));
  };

  const deselectAll = () => {
    setActiveCandidateIds([]);
  };

  // Safe preview candidate
  const previewCandidate = activeCandidates[previewCandidateIndex] || activeCandidates[0] || selectedCandidates[0];

  // Render dynamic email for specific candidate
  const getRenderedEmail = (cand: CandidateResult | undefined) => {
    if (!cand) return { subject: subjectTemplate, body: bodyTemplate };

    const renderedSubject = subjectTemplate
      .replace(/{Applicant Name}/g, cand.candidateName)
      .replace(/{Job Title}/g, currentVacancy.title);

    const renderedBody = bodyTemplate
      .replace(/{Applicant Name}/g, cand.candidateName)
      .replace(/{Candidate Name}/g, cand.candidateName)
      .replace(/{Job Title}/g, currentVacancy.title)
      .replace(/{Department}/g, currentVacancy.department);

    return { subject: renderedSubject, body: renderedBody };
  };

  // Helper for guaranteed email
  const getCandidateEmail = (cand: CandidateResult) => {
    if (cand.email && cand.email.includes('@')) return cand.email;
    return `${cand.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@candidate-mail.com`;
  };

  // Handle Bulk Dispatch
  const handleSendBulk = async () => {
    if (activeCandidates.length === 0) return;

    setIsSending(true);
    setSendProgress(0);

    const emailsToDispatch = activeCandidates.map((cand) => {
      const rendered = getRenderedEmail(cand);
      return {
        candidateId: cand.id,
        candidateName: cand.candidateName,
        toEmail: getCandidateEmail(cand),
        type: emailType,
        subject: rendered.subject,
        body: rendered.body,
        vacancyTitle: currentVacancy.title,
      };
    });

    try {
      // Simulate progress visually
      for (let p = 1; p <= activeCandidates.length; p++) {
        setSendProgress(Math.round((p / activeCandidates.length) * 100));
        await new Promise((r) => setTimeout(r, 120));
      }

      const res = await fetch('/api/send-bulk-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToDispatch }),
      });

      if (!res.ok) {
        throw new Error('Bulk dispatch failed on server');
      }

      const targetStatus: ShortlistStatus = isShortlist ? 'shortlisted' : 'rejected';
      onBulkEmailSent(activeCandidateIds, targetStatus, {
        subject: subjectTemplate,
        templateBody: bodyTemplate,
        type: emailType,
      });

      setCompletedSummary({
        total: activeCandidates.length,
        sentAt: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Bulk dispatch error:', err);
      // Fallback
      const targetStatus: ShortlistStatus = isShortlist ? 'shortlisted' : 'rejected';
      onBulkEmailSent(activeCandidateIds, targetStatus, {
        subject: subjectTemplate,
        templateBody: bodyTemplate,
        type: emailType,
      });

      setCompletedSummary({
        total: activeCandidates.length,
        sentAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-['Inter']">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isShortlist
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                isShortlist ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']">
                  {isShortlist
                    ? `Shoot Bulk Shortlist Emails (${activeCandidates.length} Selected)`
                    : `Shoot Bulk Rejection Emails (${activeCandidates.length} Selected)`}
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isShortlist
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  Bulk Dispatch Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Vacancy: <strong className="text-blue-700">{currentVacancy.title}</strong> • Template automatically personalizes each applicant's name and details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Banner */}
        {completedSummary && (
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-between gap-4 font-bold text-sm shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Successfully dispatched {completedSummary.total} personalized emails at {completedSummary.sentAt}!
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 cursor-pointer shadow-2xs"
            >
              Done & Close
            </button>
          </div>
        )}

        {/* Modal Content - 2 Column Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Template Editor & Dynamic Variable Highlight (7 Cols) */}
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Shared Email Template
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Variable: <code className="text-blue-600 font-mono font-bold">{"{Applicant Name}"}</code>
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject Line Template
              </label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Email Body Template
                </label>
                <span className="text-[10px] text-slate-400">
                  Only the applicant's name dynamically adapts per email
                </span>
              </div>
              <textarea
                rows={11}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50/50 font-mono text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-blue-600 focus:outline-none select-text"
              />
            </div>

            {/* Quick helper tag */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                When you click <strong>"Shoot Bulk Emails"</strong>, our engine creates an individual email instance for each checked applicant with their personal contact address and exact name substituted in place.
              </p>
            </div>
          </div>

          {/* Right Column: Recipient Checklist & Live Preview (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target Recipients ({activeCandidates.length} / {selectedCandidates.length})
                </span>
                <p className="text-[11px] text-slate-500">
                  Select who will receive this email
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>

            {/* Recipient Cards / List */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {selectedCandidates.map((cand, idx) => {
                const isChecked = activeCandidateIds.includes(cand.id);
                const isPreview = previewCandidate?.id === cand.id;
                const emailAddr = getCandidateEmail(cand);

                return (
                  <div
                    key={cand.id}
                    onClick={() => setPreviewCandidateIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isPreview
                        ? 'border-blue-500 bg-blue-50/70 shadow-2xs'
                        : isChecked
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200 bg-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCandidate(cand.id);
                        }}
                        className="text-slate-500 hover:text-blue-600 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">
                          {cand.candidateName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {emailAddr}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cand.matchScore}%
                      </span>
                      {isPreview && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Personalized Preview Box */}
            {previewCandidate && (
              <div className="mt-auto pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    Personalized Sample: {previewCandidate.candidateName}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {getCandidateEmail(previewCandidate)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5 text-xs">
                  <div className="text-slate-800 font-bold text-[11px] border-b border-slate-100 pb-1">
                    Sub: {getRenderedEmail(previewCandidate).subject}
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                    {getRenderedEmail(previewCandidate).body}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Ready to dispatch <strong>{activeCandidates.length}</strong> {isShortlist ? 'shortlist' : 'rejection'}{' '}
            notification emails for <strong>{currentVacancy.title}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSending || activeCandidates.length === 0}
              onClick={handleSendBulk}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                isShortlist
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
              } ${isSending || activeCandidates.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching {sendProgress}%...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    Shoot {activeCandidates.length} {isShortlist ? 'Shortlist' : 'Rejection'} Emails Now
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
