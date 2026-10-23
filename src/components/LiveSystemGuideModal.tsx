import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Send,
  Sliders,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Server,
  Terminal,
  HelpCircle,
  Copy,
  Check,
  Mail,
  Zap,
  Key,
  CreditCard,
  Share2,
} from 'lucide-react';
import { IpathLogo } from './IpathLogo';

interface LiveSystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveSystemGuideModal: React.FC<LiveSystemGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'screening' | 'apis' | 'amending' | 'it-handoff' | 'production'>('screening');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <IpathLogo size="sm" showTagline={false} />
            <div className="hidden sm:block border-l border-slate-300 pl-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                System Architecture & Live API Guide
              </span>
              <span className="text-[11px] text-slate-500">
                How Screening Match, Backend APIs, and Live Adjustments Work
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('screening')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'screening'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. How Screening Match Works</span>
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'apis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>2. Backend APIs & Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('amending')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'amending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Live Usage & Amending Details</span>
          </button>

          <button
            onClick={() => setActiveTab('it-handoff')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'it-handoff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>4. IT Handoff & Own API Credits</span>
          </button>

          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'production'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>5. Email Relay / Production Setup</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* TAB 1: SCREENING MATCH LOGIC */}
          {activeTab === 'screening' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    %
                  </span>
                  Multi-Factor Requirement Alignment Algorithm
                </h3>
                <p className="text-slate-600 mt-1">
                  <strong>Ipath Talent Match</strong> evaluates each resume against the designated job description using a balanced multi-vector scoring model:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      1. Core Skills Match
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs">
                      40% Weight
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Evaluates mandatory technical and domain skills listed in the Job Description. The engine checks not just keyword appearance, but contextual project application in the candidate's work history.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      2. Experience & Tenure
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs">
                      30% Weight
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Calculates cumulative years of relevant experience vs the vacancy’s minimum requirement (e.g. 3+ years). Candidates meeting or exceeding experience score full marks; junior candidates receive prorated scores.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      3. Education & Certifications
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs">
                      15% Weight
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Verifies educational qualifications (B.Tech, BE, MCA, MBA, or equivalent) and relevant vendor certifications (AWS, Google Cloud, PMP, Scrum) specified in the profile.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      4. Role Scope & Responsibilities
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs">
                      15% Weight
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Checks semantic overlap with day-to-day responsibilities: team leadership, architecture, client handling, agile delivery, or domain exposure.
                  </p>
                </div>
              </div>

              {/* Status Tiers */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Automated Recommendation Thresholds:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                    <span className="text-emerald-400 font-bold block mb-1">80% – 100%: Shortlist</span>
                    <span className="text-slate-300">
                      Exceptional alignment with core skills & experience. Ready for direct interview invite.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40">
                    <span className="text-amber-400 font-bold block mb-1">60% – 79%: Review</span>
                    <span className="text-slate-300">
                      Strong candidate with 1 or 2 minor skill gaps. Requires HR or hiring manager review.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40">
                    <span className="text-rose-400 font-bold block mb-1">Below 60%: Rejected</span>
                    <span className="text-slate-300">
                      Does not meet baseline experience or mandatory technical criteria.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKEND APIS & PIPELINE */}
          {activeTab === 'apis' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  REST API Endpoints Overview
                </h3>
                <p className="text-slate-600 mt-1">
                  The application runs a secure server architecture with dedicated endpoints for document parsing, AI evaluation, and candidate communications.
                </p>
              </div>

              <div className="space-y-3">
                {/* Endpoint 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-600 text-white">
                        POST
                      </span>
                      <code className="font-mono text-xs font-bold text-slate-900">
                        /api/parse-match-resume
                      </code>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Core Screening Engine</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Ingests uploaded CV files (PDF, DOCX, DOC, or text) along with the active Job Description. Extracts candidate identity (name, email, phone, title, experience), validates text with Gemini 2.5 Flash against a strict JSON schema, calculates fit breakdown, extracts evidence, and highlights gaps.
                  </p>
                </div>

                {/* Endpoint 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-600 text-white">
                        POST
                      </span>
                      <code className="font-mono text-xs font-bold text-slate-900">
                        /api/extract-jd
                      </code>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Job Description Extraction</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Accepts raw unstructured job descriptions copied from LinkedIn, job portals, or company career pages and converts them into structured hiring profiles (title, min experience, core skills, responsibilities).
                  </p>
                </div>

                {/* Endpoint 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-purple-600 text-white">
                        POST
                      </span>
                      <code className="font-mono text-xs font-bold text-slate-900">
                        /api/send-email & /api/send-bulk-emails
                      </code>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Candidate Communication</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Dispatches personalized Shortlisted or Rejection emails to one or multiple candidates simultaneously. Populates custom dynamic fields like applicant name and vacancy title, and records delivery timestamps in the candidate's history log.
                  </p>
                </div>

                {/* Endpoint 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-600 text-white">
                        POST / GET
                      </span>
                      <code className="font-mono text-xs font-bold text-slate-900">
                        /api/vacancies & /api/vacancies/:id/archive
                      </code>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Backend Vacancy Repository</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Maintains active vacancies and backend archives. When an active vacancy is closed or removed, it is stored safely in the backend repository—preserving all job criteria, required skills, and screening history for future reactivation or screening.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE USAGE & AMENDING DETAILS */}
          {activeTab === 'amending' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Amending Candidate & Vacancy Details In Real Time
                </h3>
                <p className="text-slate-600 mt-1">
                  HR teams have full live control to edit candidate records, tweak requirements, and manage active/archived vacancies at any time:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                      1
                    </span>
                    Amend Candidate Records
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Email Address:</strong> If a candidate's email needs correcting or updating before shooting an email, click "Amend Candidate Details" inside the candidate audit modal.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Name & Phone:</strong> Amend any misformatted names or contact numbers with instant save.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Recruiter Notes:</strong> Add private commentary, interview dates, or salary expectations.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                      2
                    </span>
                    Amend Vacancy Requirements
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Edit Job Description:</strong> Click the "Edit Profile" button to add or remove core skills or adjust minimum experience years.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Cross-Screening Pools:</strong> Easily evaluate candidate pools uploaded for one vacancy against another role with 1-click re-scoring.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Bulk Selection:</strong> Select any candidates to shoot bulk shortlist/rejection emails or clear unwanted entries.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">
                      3
                    </span>
                    Archive & Backend Preservation
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Remove from Active:</strong> Click "Archive / Keep in Backend" to take any role off the active board without losing data.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Kept in Backend:</strong> All criteria, required skills, and evaluated candidate pools remain safely saved in the backend repository.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Reactivate or Screen:</strong> Re-open or screen candidates against the archived role whenever you need in the future.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IT TEAM HANDOFF & API CREDITS */}
          {activeTab === 'it-handoff' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  IT Team Handoff & Connecting Corporate API Credits
                </h3>
                <p className="text-slate-600 mt-1">
                  How to pass this application to the IT department so all AI screening, parsing, and email agent workloads use your company's own Google Cloud billing and API credits, while preserving this current instance as a demo/testing sandbox.
                </p>
              </div>

              {/* 2 Environments strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                    Environment A: Demo & Sandbox (This Current App)
                  </div>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    <strong>Keep as-is:</strong> Keep this active deployment URL to test resumes, perform live demos for executives or HR leadership, and train recruiters without touching company production data.
                  </p>
                  <div className="text-[11px] text-blue-700 bg-white/70 p-2 rounded-lg border border-blue-200">
                    ✓ Zero setup required • Ready for instant stakeholder demonstration
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Environment B: Corporate Production (IT Team)
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    <strong>IT Deploys:</strong> Hosted on iPath Infotech's cloud domain (e.g. <code>talentmatch.ipathinfotech.com</code>) using your corporate Google Cloud billing account, company API keys, and corporate email relay.
                  </p>
                  <div className="text-[11px] text-emerald-700 bg-white/70 p-2 rounded-lg border border-emerald-200">
                    ✓ Managed by IT • Dedicated enterprise quotas and SLA
                  </div>
                </div>
              </div>

              {/* Step by step for IT */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  3-Step Instructions for Your IT Team
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <strong className="text-slate-900">Provision Corporate Gemini API Key & Credits</strong>
                      <p className="text-slate-600">
                        IT logs into Google AI Studio (<code>https://aistudio.google.com/app/apikey</code>) or Google Cloud Vertex AI using the company's enterprise Google Workspace admin account. They link the project to iPath Infotech's GCP Corporate Billing Account or enterprise credits, and generate an API key.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <strong className="text-slate-900">Share or Clone Codebase to Corporate Git</strong>
                      <p className="text-slate-600">
                        IT clones or imports the repository into company GitHub / GitLab. The project is a standard full-stack Node.js + Vite + Express TypeScript app with zero proprietary runtime lock-in.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="space-y-1">
                      <strong className="text-slate-900">Configure Production Environment (.env)</strong>
                      <p className="text-slate-600">
                        IT inputs their corporate <code>GEMINI_API_KEY</code> and starts the production container. All AI token charges will debit directly from the company's Google Cloud credit line.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready-to-copy IT handoff memo */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 relative">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-xs text-sky-400 font-sans font-semibold">
                    <Share2 className="w-3.5 h-3.5" />
                    Copyable Memo for IT Department
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
`Hi IT Team,\n\nHere is the handoff for the "Ipath Talent Match" AI Resume Screening Platform:\n\n1. Purpose: Automated HR resume screening, ranking against vacancies, and candidate shortlist/rejection dispatch.\n2. Tech Stack: Node.js (v18+), Express, Vite + React TypeScript, Tailwind CSS, Google Gemini 2.5 Flash SDK (@google/genai).\n3. Corporate API Setup:\n   - Please generate an enterprise Gemini API key under our company Google Cloud account at https://aistudio.google.com/app/apikey (linked to company billing/credits).\n   - Set GEMINI_API_KEY="<corporate-key>" in the production .env file.\n4. Run Commands:\n   - npm install\n   - npm run build\n   - npm start (runs on PORT 3000)\n5. The current preview URL will remain active as our HR Demo & Testing sandbox.\n\nThank you!`,
                        'it_memo'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] hover:text-white cursor-pointer px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 font-sans"
                  >
                    {copiedKey === 'it_memo' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy IT Handoff Memo</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
{`# IT Production .env File:
GEMINI_API_KEY="AIzaSy..."          # iPath Infotech Corporate Google Cloud Key
APP_URL="https://talentmatch.ipathinfotech.com"
PORT=3000

# Optional: Corporate SMTP Relay for Candidate Emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="hr@ipathinfotech.com"
SMTP_PASS="corporate-app-password"`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCTION SETUP & SMTP */}
          {activeTab === 'production' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Live Production Deployment & SMTP Email Relay
                </h3>
                <p className="text-slate-600 mt-1">
                  In live testing and development, dispatched candidate emails are processed and logged directly in the recruiter pipeline. To connect your live corporate email server (Google Workspace, Office 365, SendGrid, or AWS SES), simply configure standard SMTP variables:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 relative">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Production .env Configuration (Optional SMTP Relay)</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=hr@ipathinfotech.com\nSMTP_PASS=your-app-password\nSMTP_FROM="iPath Infotech Careers" <hr@ipathinfotech.com>`,
                        'smtp_env'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'smtp_env' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p># iPath Infotech Corporate Mail Relay</p>
                  <p><span className="text-sky-400">SMTP_HOST</span>=smtp.gmail.com</p>
                  <p><span className="text-sky-400">SMTP_PORT</span>=587</p>
                  <p><span className="text-sky-400">SMTP_USER</span>=hr@ipathinfotech.com</p>
                  <p><span className="text-sky-400">SMTP_PASS</span>=app-specific-secure-password</p>
                  <p><span className="text-sky-400">SMTP_FROM</span>="iPath Infotech Careers" &lt;hr@ipathinfotech.com&gt;</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <strong>Live Ready:</strong> The current environment is already 100% active and connected to Gemini 2.5 Flash for resume parsing and multi-candidate scoring, with full support for PDF, DOCX, DOC, and TXT files.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Ipath Talent Match • Enterprise Screening Engine
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Got it, Back to App
          </button>
        </div>
      </div>
    </div>
  );
};
