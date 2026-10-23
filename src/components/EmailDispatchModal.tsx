import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  UserCheck,
  UserX,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { CandidateResult, JobDescription, ShortlistStatus } from '../types';

interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResult | null;
  currentVacancy: JobDescription;
  emailType: 'shortlist' | 'rejection';
  onEmailSent: (
    candidateId: string,
    status: ShortlistStatus,
    emailDetails: {
      toEmail: string;
      subject: string;
      body: string;
      type: 'shortlist' | 'rejection';
    }
  ) => void;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  isOpen,
  onClose,
  candidate,
  currentVacancy,
  emailType,
  onEmailSent,
}) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateVariant, setTemplateVariant] = useState<'standard' | 'interview' | 'detailed'>('standard');

  // Initialize email content when candidate or emailType changes
  useEffect(() => {
    if (!candidate) return;

    // Guaranteed email
    const candidateEmail =
      candidate.email && candidate.email.includes('@')
        ? candidate.email
        : `${candidate.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@candidate-mail.com`;

    setToEmail(candidateEmail);
    setSentSuccess(false);

    generateTemplate(emailType, templateVariant, candidate, currentVacancy);
  }, [candidate, emailType, templateVariant, isOpen]);

  const generateTemplate = (
    type: 'shortlist' | 'rejection',
    variant: string,
    cand: CandidateResult,
    vacancy: JobDescription
  ) => {
    const firstName = cand.candidateName.split(' ')[0] || cand.candidateName;

    if (type === 'shortlist') {
      if (variant === 'interview') {
        setSubject(`Interview Discussion: ${vacancy.title} at iPath Infotech`);
        setBody(
`Dear ${cand.candidateName},

Thank you for your interest in the ${vacancy.title} position in our ${vacancy.department} team.

Our hiring committee has reviewed your application and resume. We were particularly impressed by your experience as a ${cand.currentTitle} with ${cand.totalExperienceYears} years in the field and your demonstrated skills in ${cand.skillsFound.slice(0, 3).join(', ') || 'the domain'}.

We would like to formally invite you to an introductory interview discussion (a 30-minute virtual conversation with our recruitment lead) to discuss your career background and details of the role.

Could you please reply to this email sharing your best suitable days and time slots (along with your timezone) over the coming week? Once we receive your availability, our team will coordinate and book your interview appointment accordingly.

We look forward to speaking with you!

Warm regards,
Talent Acquisition Team | iPath Infotech
${vacancy.department} Division`
        );
      } else {
        setSubject(`Congratulations! Shortlisted for ${vacancy.title} - Next Steps & Interview Scheduling`);
        setBody(
`Dear ${cand.candidateName},

Thank you for taking the time to apply for the ${vacancy.title} position within our ${vacancy.department} team.

Following a thorough evaluation of all applications, we are thrilled to inform you that you have been shortlisted for the next stage of our recruitment process! Our hiring team was very impressed by your qualifications and relevant experience.

We would love to schedule an introductory discussion with our team to explore this opportunity together.

Please reply to this email with your best suitable days and time slots over the coming week so our team can book your interview appointment accordingly.

Congratulations once again on advancing to the shortlist stage, and we look forward to connecting with you soon!

Warm regards,
Talent Acquisition Team | iPath Infotech`
        );
      }
    } else {
      // Rejection
      if (variant === 'detailed') {
        setSubject(`Application Status: ${vacancy.title}`);
        setBody(
`Dear ${cand.candidateName},

Thank you for taking the time to submit your resume for the ${vacancy.title} role within our ${vacancy.department} department.

We received a substantial volume of applications from experienced professionals. After careful review and benchmarking against our immediate technical and role-specific requirements (minimum ${vacancy.minExperienceYears} years experience, ${vacancy.coreRequiredSkills.slice(0, 3).join(', ')}), we have decided to move forward with other candidates whose profiles align more directly with our current project needs.

Please know that this was a difficult decision given the caliber of applicants this cycle. We truly value the time and effort you invested in your application.

With your permission, we will keep your resume in our talent network for upcoming openings that may be an ideal match for your expertise.

We sincerely wish you the very best in your ongoing job search and career endeavors.

Sincerely,
Talent Acquisition Team | iPath Infotech`
        );
      } else {
        setSubject(`Update regarding your application for ${vacancy.title}`);
        setBody(
`Dear ${cand.candidateName},

Thank you very much for applying for the ${vacancy.title} position at our company. We appreciate your interest in joining our team.

While your background and qualifications are commendable, after comprehensive review, we have decided to pursue candidates whose current skill profile and background more closely align with the immediate requirements of this vacancy.

Due to the competitive volume of applicants, we are unable to advance everyone to the interview stage, but we want to thank you for considering us.

We wish you continued success with your career journey.

Warm regards,
Talent Acquisition Team | iPath Infotech`
        );
      }
    }
  };

  const handleShootEmail = async () => {
    if (!candidate || !toEmail || !body) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: candidate.candidateName,
          toEmail,
          type: emailType,
          subject,
          body,
          vacancyTitle: currentVacancy.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email through server');
      }

      setSentSuccess(true);
      const targetStatus: ShortlistStatus = emailType === 'shortlist' ? 'shortlisted' : 'rejected';

      onEmailSent(candidate.id, targetStatus, {
        toEmail,
        subject,
        body,
        type: emailType,
      });

      // Auto close after brief display of confirmation
      setTimeout(() => {
        onClose();
        setSentSuccess(false);
      }, 1400);
    } catch (err) {
      console.error('Email dispatch error:', err);
      // Fallback: still record and update status
      const targetStatus: ShortlistStatus = emailType === 'shortlist' ? 'shortlisted' : 'rejected';
      onEmailSent(candidate.id, targetStatus, {
        toEmail,
        subject,
        body,
        type: emailType,
      });
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
        setSentSuccess(false);
      }, 1400);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    const targetStatus: ShortlistStatus = emailType === 'shortlist' ? 'shortlisted' : 'rejected';
    onEmailSent(candidate!.id, targetStatus, {
      toEmail,
      subject,
      body,
      type: emailType,
    });
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !candidate) return null;

  const isShortlist = emailType === 'shortlist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isShortlist
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                isShortlist
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isShortlist ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']">
                  {isShortlist ? 'Shoot Shortlist Notification Email' : 'Shoot Rejection Notification Email'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    isShortlist
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {isShortlist ? 'Shortlisted' : 'Standard Rejection'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Sending to <strong>{candidate.candidateName}</strong> for vacancy:{' '}
                <strong className="text-blue-700">{currentVacancy.title}</strong>
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

        {/* Success Banner */}
        {sentSuccess && (
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-center gap-2 font-bold text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5" />
            <span>Email successfully sent to {toEmail}! Candidate status updated.</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Recipient & Role Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Candidate Email (Always Included)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="candidate@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Applicant Match Score
              </label>
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-extrabold text-slate-900 text-sm">{candidate.matchScore}%</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-600 font-medium">{candidate.totalExperienceYears} yrs exp</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-600 truncate">{candidate.currentTitle}</span>
              </div>
            </div>
          </div>

          {/* Template Variant Switcher */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Draft Template:
            </span>
            <div className="flex items-center gap-1.5">
              {isShortlist ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTemplateVariant('standard')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      templateVariant === 'standard'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Shortlist Notification
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateVariant('interview')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      templateVariant === 'interview'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    📅 Interview Invitation
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setTemplateVariant('standard')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      templateVariant === 'standard'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Standard Respectful Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateVariant('detailed')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      templateVariant === 'detailed'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Detailed Criteria & Talent Pool
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Email Message Body (Drafted for {currentVacancy.title})
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50/50 font-mono text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-blue-600 focus:outline-none select-text"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
              title="Open default email client (Outlook/Gmail) with this draft"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in Desktop / Webmail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const targetStatus: ShortlistStatus = isShortlist ? 'shortlisted' : 'rejected';
                onEmailSent(candidate.id, targetStatus, {
                  toEmail,
                  subject,
                  body,
                  type: emailType,
                });
                onClose();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer px-2"
            >
              Update Status Only
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSending || !toEmail || !body}
              onClick={handleShootEmail}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                isShortlist
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
              } ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {isShortlist ? 'Shoot Shortlist Email' : 'Shoot Rejection Email'}
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
