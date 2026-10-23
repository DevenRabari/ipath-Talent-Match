import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, ShieldCheck, Users, Info, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  // The public shared preview link for this applet
  const sharedUrl = 'https://ais-pre-wul65n4db5kgq756ugjfak-178589312849.asia-southeast1.run.app';

  const hrExecutiveSummary = `🚀 iPath Infotech - Talent Match | AI Candidate Screening Platform
Public App Testing Link: ${sharedUrl}

📌 WHAT IT IS:
An AI-powered candidate evaluation and screening platform built to eliminate manual resume screening. It evaluates candidate CVs against open job vacancies using objective mathematical scoring.

⚙️ HOW IT WORKS:
1. Define Vacancy: HR sets title, department, min experience, and mandatory skills (or auto-extracts from a pasted job description).
2. Upload CVs in Bulk: Upload candidate resumes (PDF, DOCX, or text). Deep multi-page text parsing extracts skills, work history, and contact details.
3. Weighted Matching: Evaluates Core Skills (50%), Experience Tenure (25%), Preferred Tech (15%), and Education (10%).
4. Automated Shortlisting: Candidates scoring 80%+ are immediately qualified and shortlisted for interview rounds.
5. Action & Communication: Compare candidates side-by-side, download resumes, and dispatch personalized interview discussion emails.

🌟 KEY BENEFITS FOR HR:
• Saves 90% of Screening Time: Review 100+ resumes in under 2 minutes.
• Objective & Unbiased: Decisions backed by verified criteria and career timelines.
• Candidate Quality: Immediate identification of top matching talent.
• Audit-Ready: Export shortlisted candidate reports directly to CSV/Excel.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(hrExecutiveSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Share2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Share & Test Link for HR Team</h2>
              <p className="text-xs text-blue-200">Publicly accessible link for anyone to test the screener</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Main Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Public Testing URL (No Google Login Required)
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-800 focus:outline-hidden select-all"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <a
                href={sharedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                title="Open in new window to test"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Notice: Why the previous link failed */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Why the previous link gave an error:</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              The internal development link (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">ais-dev-...</code>) is private to the developer's Google account.
              The link above (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">ais-pre-...</code>) is the <strong>Shared Public Preview URL</strong> that anyone on HR or external testing can open in any browser without Google sign-in.
            </p>
          </div>

          {/* HR Testing Checklist */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>What HR Can Test Directly:</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>PDF & DOCX Resumes:</strong> Deep multi-page text extraction captures all skills, contact info, experience, and projects.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Department Management:</strong> Click &quot;+ Add New&quot; in the Vacancy modal to enter new custom departments that save into the dropdown.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Resume Downloads:</strong> Download candidate resumes directly from candidate cards or shortlisted dossiers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Interview Discussion Emails:</strong> Preview and shoot personalized discussion invitations with candidate details pre-filled.</span>
              </li>
            </ul>
          </div>

          {/* HR Executive Briefing Card & Copy Action */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/70 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>HR Briefing & Feature Highlights</span>
              </span>
              <button
                type="button"
                onClick={handleCopySummary}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  copiedSummary
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HR Summary</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Need a quick summary to email to HR or paste in Slack/WhatsApp? Click <strong>Copy HR Summary</strong> to copy the app breakdown, workflow steps, and HR benefits along with the public link.
            </p>
          </div>

          {/* AI Studio Share Tip */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              In Google AI Studio, ensure you click the <strong>&quot;Share&quot;</strong> button at the top-right of your screen and select <strong>&quot;Anyone with the link&quot;</strong> to guarantee public availability for your HR team.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
          <a
            href={sharedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <span>Open Testing Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
