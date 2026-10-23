import React from 'react';
import { Download, Cpu, Share2 } from 'lucide-react';
import { CandidateResult } from '../types';
import { IpathLogo } from './IpathLogo';

interface HeaderProps {
  candidates: CandidateResult[];
  onOpenExport: () => void;
  onOpenGuide?: () => void;
  onOpenShare?: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  candidates,
  onOpenExport,
  onOpenGuide,
  onOpenShare,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-blue-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand: iPath Infotech prominently highlighted */}
        <div className="flex items-center">
          <IpathLogo size="md" showTagline={true} />
        </div>

        {/* Clean, perfectly aligned top-bar actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
              title="Get public link to share and test with HR"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Share & Test Link</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
              title="View how Screening Match and Backend APIs work"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>How APIs & Matching Work</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            disabled={candidates.length === 0}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
            title="Export shortlisted candidates to CSV or Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Shortlist</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
