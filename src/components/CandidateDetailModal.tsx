import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  UserCheck,
  UserX,
  ShieldAlert,
  Trash2,
  Send,
  Edit3,
  Save,
  Download,
} from 'lucide-react';
import { CandidateResult, JobDescription, ShortlistStatus } from '../types';
import { downloadCandidateResume } from '../utils/downloadResume';

interface CandidateDetailModalProps {
  candidate: CandidateResult | null;
  currentVacancy: JobDescription;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (candidateId: string, status: ShortlistStatus, notes?: string) => void;
  onUpdateCandidate?: (updatedCandidate: CandidateResult) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onShootEmail?: (candidate: CandidateResult, type: 'shortlist' | 'rejection') => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  currentVacancy,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateCandidate,
  onDeleteCandidate,
  onShootEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'interview_prep' | 'email_templates'>('audit');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [hrNotes, setHrNotes] = useState(candidate?.hrNotes || '');

  // Amend Candidate Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editExp, setEditExp] = useState('0');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    if (candidate) {
      setHrNotes(candidate.hrNotes || '');
      setEditName(candidate.candidateName || '');
      setEditEmail(candidate.email || '');
      setEditPhone(candidate.phone || '');
      setEditTitle(candidate.currentTitle || '');
      setEditExp(candidate.totalExperienceYears?.toString() || '0');
      setEditLocation(candidate.location || '');
      setIsEditing(false);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const meetsExp = candidate.totalExperienceYears >= currentVacancy.minExperienceYears;

  const handleStatusChange = (status: ShortlistStatus) => {
    onUpdateStatus(candidate.id, status, hrNotes);
  };

  const handleSaveNotes = () => {
    onUpdateStatus(candidate.id, candidate.shortlistStatus, hrNotes);
  };

  const handleSaveAmendedDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: CandidateResult = {
      ...candidate,
      candidateName: editName.trim() || candidate.candidateName,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      currentTitle: editTitle.trim() || candidate.currentTitle,
      totalExperienceYears: parseFloat(editExp) || candidate.totalExperienceYears,
      location: editLocation.trim(),
      hrNotes: hrNotes,
    };
    if (onUpdateCandidate) {
      onUpdateCandidate(updated);
    }
    setIsEditing(false);
  };

  const interviewEmailTemplate = `Dear ${candidate.candidateName},

Congratulations! Thank you for applying for the ${currentVacancy.title} position in our ${currentVacancy.department} team.

Our recruitment team thoroughly reviewed your background and we are thrilled to inform you that you have been shortlisted for the role! We were particularly impressed by your experience as a ${candidate.currentTitle} with ${candidate.totalExperienceYears} years of experience and your demonstrated expertise in ${candidate.skillsFound.slice(0, 3).join(', ')}.

We would like to schedule an introductory interview discussion with you over the coming days to explore this opportunity.

Please reply to this email sharing your best suitable days and time slots (along with your timezone) over the coming week so our team can book your interview appointment accordingly.

Looking forward to speaking with you!

Warm regards,
Talent Acquisition Team | iPath Infotech`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-2xs ${
                candidate.matchScore >= 80
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : candidate.matchScore >= 60
                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {candidate.matchScore}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                  {candidate.candidateName}
                </h2>
                {candidate.rank === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Trophy className="w-3 h-3 text-emerald-600" />
                    #1 RANKED MATCH
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {candidate.currentTitle} • Screening against <strong className="text-blue-700">{currentVacancy.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCandidateResume(candidate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer"
              title="Download candidate resume / profile dossier directly"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download Resume</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Amend candidate name, email, phone, title, or experience"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Amendment' : 'Amend Details'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Amend Candidate Details Form */}
        {isEditing && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 animate-fadeIn shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                  Amend Candidate Details & Contact Information
                </h3>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                Changes update applicant records and outgoing email drafts
              </span>
            </div>
            <form onSubmit={handleSaveAmendedDetails} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Candidate Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. candidate@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 555-0192"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total Experience (Years)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={editExp}
                  onChange={(e) => setEditExp(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. New York, NY / Remote"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Amended Details</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Candidate Metadata Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <strong className="text-slate-900">{candidate.totalExperienceYears} yrs experience</strong>
              {meetsExp ? (
                <span className="text-emerald-700 font-bold ml-1">(Meets {currentVacancy.minExperienceYears}+ yrs requirement)</span>
              ) : (
                <span className="text-amber-700 font-bold ml-1">(Below {currentVacancy.minExperienceYears} yrs req)</span>
              )}
            </span>

            {candidate.location && (
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {candidate.location}
              </span>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-semibold">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{candidate.email && candidate.email.includes('@') ? candidate.email : `${candidate.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@candidate-mail.com`}</span>
              <button
                type="button"
                onClick={() => {
                  const em = candidate.email && candidate.email.includes('@') ? candidate.email : `${candidate.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@candidate-mail.com`;
                  navigator.clipboard.writeText(em);
                }}
                className="text-blue-500 hover:text-blue-800 ml-1 cursor-pointer"
                title="Copy candidate email"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {candidate.phone && (
              <span className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {candidate.phone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              File: {candidate.fileName}
            </span>
            {candidate.folderName && (
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                📁 {candidate.folderName}
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Requirement Matching Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('interview_prep')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'interview_prep'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Targeted Interview Questions ({candidate.suggestedInterviewQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('email_templates')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'email_templates'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Candidate Email Drafts</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {activeTab === 'audit' && (
            <div className="space-y-5">
              {/* Score Component Breakdown Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Overall Fit Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900">{candidate.matchScore}%</span>
                    <span
                      className={`text-xs font-bold uppercase ${
                        candidate.matchScore >= 80
                          ? 'text-emerald-700'
                          : candidate.matchScore >= 60
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {candidate.verdict}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Skills Match</span>
                    <span className="font-bold text-slate-900">{candidate.skillsMatchScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${candidate.skillsMatchScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Core & preferred coverage</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Experience Fit</span>
                    <span className="font-bold text-slate-900">{candidate.experienceMatchScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${candidate.experienceMatchScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Years of relevant seniority</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Role / Domain Fit</span>
                    <span className="font-bold text-slate-900">{candidate.educationRoleMatchScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${candidate.educationRoleMatchScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Title & education alignment</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Hiring Manager Executive Brief
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {candidate.executiveSummary}
                </p>
              </div>

              {/* Requirement Match Evidence Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Job Description Requirement-by-Requirement Evidence
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {candidate.matchedRequirements.filter((r) => r.status === 'matched').length} of{' '}
                    {candidate.matchedRequirements.length} criteria verified
                  </span>
                </div>

                <div className="space-y-2">
                  {candidate.matchedRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {req.status === 'matched' ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              MATCHED
                            </span>
                          ) : req.status === 'partial' ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              PARTIAL
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              MISSING
                            </span>
                          )}
                          <span className="font-bold text-slate-900">{req.requirement}</span>
                        </div>
                      </div>

                      <div className="pl-6 text-slate-600 text-xs leading-relaxed">
                        <strong className="text-slate-800">Resume Evidence:</strong>{' '}
                        <span className="text-slate-800 italic">"{req.evidence}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Requirements & Criticality */}
              {candidate.missingRequirements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Identified Requirement Gaps ({candidate.missingRequirements.length})
                  </h3>
                  <div className="space-y-2">
                    {candidate.missingRequirements.map((mis, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs flex items-start gap-2.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-900">{mis.requirement}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                mis.impact === 'Critical'
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {mis.impact} Gap
                            </span>
                          </div>
                          <p className="text-slate-700 mt-0.5 leading-relaxed">{mis.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Red Flags in Two Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Key Verified Strengths
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {candidate.keyStrengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Concerns / Red Flags */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Gaps & Points to Probe
                  </div>
                  {candidate.redFlagsOrConcerns.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No red flags or critical disqualifiers detected in CV text.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-800">
                      {candidate.redFlagsOrConcerns.map((rf, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Skills Extracted */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  All Skills Extracted from Resume ({candidate.skillsFound.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillsFound.map((skill, i) => {
                    const isReq = currentVacancy.coreRequiredSkills.some((s) =>
                      skill.toLowerCase().includes(s.toLowerCase())
                    );
                    return (
                      <span
                        key={i}
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          isReq
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interview_prep' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Targeted Interview Questions Generated by Gemini
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Calibrated specifically for {candidate.candidateName}'s CV against {currentVacancy.title} criteria to probe gaps and confirm claims.
                </p>
              </div>

              <div className="space-y-3">
                {candidate.suggestedInterviewQuestions.map((iq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                        Q{idx + 1}
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-sm font-bold text-slate-900">"{iq.question}"</p>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                          <strong className="text-blue-800">HR Evaluation Goal:</strong>{' '}
                          {iq.probeObjective}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'email_templates' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Interview Invitation Email Draft
                  </h3>
                  <button
                    onClick={() => copyToClipboard(interviewEmailTemplate)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ready-to-send personalized email tailored with candidate's title and key skills.
                </p>
              </div>

              <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                {interviewEmailTemplate}
              </pre>
            </div>
          )}

          {/* HR Decision & Notes Area */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900">Shortlisting Decision</span>
                <p className="text-[11px] text-slate-500">
                  Update candidate status in recruitment pipeline
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleStatusChange('shortlisted')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                    candidate.shortlistStatus === 'shortlisted'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shortlist</span>
                </button>

                <button
                  onClick={() => handleStatusChange('interview')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                    candidate.shortlistStatus === 'interview'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Interview</span>
                </button>

                <button
                  onClick={() => handleStatusChange('review')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                    candidate.shortlistStatus === 'review'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hold / Review</span>
                </button>

                <button
                  onClick={() => handleStatusChange('rejected')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                    candidate.shortlistStatus === 'rejected'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadCandidateResume(candidate)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300"
                  title="Download candidate resume / dossier"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Resume</span>
                </button>

                {onDeleteCandidate && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Remove candidate "${candidate.candidateName}" from screening results?`
                        )
                      ) {
                        onDeleteCandidate(candidate.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 sm:ml-auto"
                    title="Remove candidate from screening"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Candidate</span>
                  </button>
                )}
              </div>

              {onShootEmail && (
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => onShootEmail(candidate, 'shortlist')}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Shortlist & Shoot Notification Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShootEmail(candidate, 'rejection')}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reject & Shoot Rejection Email</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Internal Recruiter Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="e.g. Passed initial screen; solid portfolio; salary expectations aligned..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
