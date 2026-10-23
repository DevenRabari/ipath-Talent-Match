import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileText, Printer, FileDown } from 'lucide-react';
import { CandidateResult, JobDescription } from '../types';
import { downloadCandidateResume } from '../utils/downloadResume';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateResult[];
  currentVacancy: JobDescription;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  candidates,
  currentVacancy,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportOnlyShortlisted, setExportOnlyShortlisted] = useState(true);

  if (!isOpen) return null;

  const targetCandidates = exportOnlyShortlisted
    ? candidates.filter((c) => c.shortlistStatus === 'shortlisted' || c.matchScore >= 80)
    : candidates;

  const sortedCandidates = [...targetCandidates].sort((a, b) => b.matchScore - a.matchScore);

  const generateCSV = () => {
    const headers = [
      'Rank',
      'Candidate Name',
      'Current Title',
      'Experience (Years)',
      'Match Score (%)',
      'Skills Match (%)',
      'Experience Match (%)',
      'Status',
      'Email',
      'Phone',
      'Folder/Source',
      'Resume File',
      'Top Strengths',
    ];

    const rows = sortedCandidates.map((c, idx) => [
      `#${idx + 1}`,
      `"${c.candidateName.replace(/"/g, '""')}"`,
      `"${c.currentTitle.replace(/"/g, '""')}"`,
      c.totalExperienceYears,
      `${c.matchScore}%`,
      `${c.skillsMatchScore}%`,
      `${c.experienceMatchScore}%`,
      `"${c.shortlistStatus}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.folderName || ''}"`,
      `"${c.fileName}"`,
      `"${c.keyStrengths.join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${currentVacancy.title.replace(/[^a-zA-Z0-9]/g, '_')}_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSlackSummary = () => {
    let summary = `📋 *Shortlist Report for ${currentVacancy.title}*\n`;
    summary += `Total Screened: ${candidates.length} | Shortlisted: ${sortedCandidates.length}\n\n`;

    sortedCandidates.forEach((c, i) => {
      summary += `*#${i + 1} ${c.candidateName}* (${c.matchScore}% Match)\n`;
      summary += `• Role: ${c.currentTitle} (${c.totalExperienceYears} yrs)\n`;
      summary += `• Key Fit: ${c.keyStrengths.slice(0, 2).join('; ')}\n`;
      summary += `• Status: ${c.shortlistStatus.toUpperCase()}\n\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                Export Candidate Shortlist
              </h2>
              <p className="text-xs text-slate-500">
                Share hiring reports with executives and interview panels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
            <input
              type="checkbox"
              id="exportOnlyShortlisted"
              checked={exportOnlyShortlisted}
              onChange={(e) => setExportOnlyShortlisted(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-4 w-4"
            />
            <label htmlFor="exportOnlyShortlisted" className="cursor-pointer font-bold">
              Only export shortlisted / high-match candidates ({targetCandidates.length} of {candidates.length})
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={generateCSV}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200/80">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Download CSV Spreadsheet</div>
                <div className="text-xs text-slate-500">For Excel, Google Sheets, or ATS import</div>
              </div>
            </button>

            <button
              onClick={generateSlackSummary}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-200/80">
                <Copy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {copied ? 'Copied to Clipboard!' : 'Copy Summary Brief'}
                </div>
                <div className="text-xs text-slate-500">Formatted for Slack, Teams, or Email</div>
              </div>
            </button>

            <button
              onClick={() => {
                sortedCandidates.forEach((c, idx) => {
                  setTimeout(() => downloadCandidateResume(c), idx * 250);
                });
              }}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 transition-all text-left cursor-pointer group shadow-2xs col-span-1 sm:col-span-2"
            >
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200/80">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Download Shortlisted Resumes & Dossiers</div>
                <div className="text-xs text-slate-500">Directly download resume files for all {sortedCandidates.length} candidate(s)</div>
              </div>
            </button>
          </div>

          {/* Quick Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              Shortlist Preview ({sortedCandidates.length} Candidates):
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {sortedCandidates.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded bg-white border border-slate-200 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{i + 1}</span>
                    <span className="font-bold text-slate-900">{c.candidateName}</span>
                    <span className="text-slate-500 font-medium">({c.currentTitle})</span>
                  </div>
                  <span className="font-extrabold text-emerald-700">{c.matchScore}% Match</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
