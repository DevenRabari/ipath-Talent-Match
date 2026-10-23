import React from 'react';
import { X, Trophy, CheckCircle2, XCircle, Scale, Clock, Award } from 'lucide-react';
import { CandidateResult, JobDescription } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
  allCandidates: CandidateResult[];
  currentVacancy: JobDescription;
  onSelectCandidate: (candidate: CandidateResult) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  candidateIds,
  allCandidates,
  currentVacancy,
  onSelectCandidate,
}) => {
  if (!isOpen) return null;

  const selectedCandidates = allCandidates
    .filter((c) => candidateIds.includes(c.id))
    .sort((a, b) => b.matchScore - a.matchScore);

  if (selectedCandidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                Side-by-Side Candidate Evaluation Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Benchmarking against <strong className="text-slate-800">{currentVacancy.title}</strong> ({currentVacancy.minExperienceYears}+ yrs required)
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

        {/* Matrix Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-600 uppercase tracking-wider w-48 bg-slate-50">
                    Evaluation Metric
                  </th>
                  {selectedCandidates.map((cand, idx) => (
                    <th
                      key={cand.id}
                      className={`p-3 font-bold text-slate-900 min-w-[220px] ${
                        idx === 0 ? 'bg-emerald-50/60 border-l border-emerald-200' : 'bg-slate-50/50 border-l border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900">{cand.candidateName}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                            Highest Fit
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {cand.currentTitle}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Overall Score */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Overall Match Score
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xl font-black ${
                            cand.matchScore >= 80
                              ? 'text-emerald-700'
                              : cand.matchScore >= 60
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {cand.matchScore}%
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          ({cand.verdict})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Total Experience */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Years of Experience (Req: {currentVacancy.minExperienceYears}+ yrs)
                  </td>
                  {selectedCandidates.map((cand, idx) => {
                    const meets = cand.totalExperienceYears >= currentVacancy.minExperienceYears;
                    return (
                      <td
                        key={cand.id}
                        className={`p-3 border-l ${
                          idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold text-slate-900">
                            {cand.totalExperienceYears} Years
                          </span>
                          {meets ? (
                            <span className="text-emerald-700 text-[11px] font-bold">✓ Meets</span>
                          ) : (
                            <span className="text-amber-700 text-[11px] font-bold">⚠ Below</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Skills Match */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Skills Match Rating
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <span className="font-extrabold text-slate-800">{cand.skillsMatchScore}%</span>
                    </td>
                  ))}
                </tr>

                {/* Core Matched Requirements */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Verified JD Requirements
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        {cand.matchedRequirements.map((mr, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{mr.requirement}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Identified Gaps */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Gaps / Missing Criteria
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      {cand.missingRequirements.length === 0 ? (
                        <span className="text-emerald-700 text-[11px] font-bold">
                          No critical gaps identified
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {cand.missingRequirements.map((ms, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-rose-700 font-medium">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="truncate">{ms.requirement}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Education */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Education & Credentials
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l text-slate-700 font-medium ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      {cand.educationSummary || 'Not stated'}
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="p-3 font-bold text-slate-700 bg-slate-50">
                    Candidate Action
                  </td>
                  {selectedCandidates.map((cand, idx) => (
                    <td
                      key={cand.id}
                      className={`p-3 border-l ${
                        idx === 0 ? 'bg-emerald-50/30 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onClose();
                          onSelectCandidate(cand);
                        }}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer w-full text-center shadow-2xs"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
