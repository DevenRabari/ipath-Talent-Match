import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Scale,
  Sparkles,
  Clock,
  ArrowUpDown,
  FileText,
  FolderUp,
  Trash2,
  Mail,
  Send,
  UserCheck,
  UserX,
  CheckSquare,
  Square,
  AlertTriangle,
  Copy,
  Download,
} from 'lucide-react';
import { CandidateResult, JobDescription, ShortlistStatus } from '../types';
import { downloadCandidateResume } from '../utils/downloadResume';

interface CandidateLeaderboardProps {
  candidates: CandidateResult[];
  currentVacancy: JobDescription;
  onSelectCandidate: (candidate: CandidateResult) => void;
  onUpdateCandidateStatus: (candidateId: string, status: ShortlistStatus, notes?: string) => void;
  selectedForCompare: string[];
  onToggleCompare: (candidateId: string) => void;
  onOpenCompare: () => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onClearAllCandidates?: () => void;
  onDeleteBulkCandidates?: (candidateIds: string[]) => void;
  onShootEmail?: (candidate: CandidateResult, type: 'shortlist' | 'rejection') => void;
  onShootBulkEmail?: (candidates: CandidateResult[], type: 'shortlist' | 'rejection') => void;
}

export const CandidateLeaderboard: React.FC<CandidateLeaderboardProps> = ({
  candidates,
  currentVacancy,
  onSelectCandidate,
  onUpdateCandidateStatus,
  selectedForCompare,
  onToggleCompare,
  onOpenCompare,
  onDeleteCandidate,
  onClearAllCandidates,
  onDeleteBulkCandidates,
  onShootEmail,
  onShootBulkEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shortlisted' | 'review' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'match_desc' | 'exp_desc' | 'name_asc'>('match_desc');
  const [minExpFilter, setMinExpFilter] = useState<number>(0);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.candidateName.toLowerCase().includes(q) ||
          c.currentTitle.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          c.skillsFound.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.shortlistStatus === statusFilter);
    }

    if (minExpFilter > 0) {
      result = result.filter((c) => c.totalExperienceYears >= minExpFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'match_desc') {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'exp_desc') {
        return b.totalExperienceYears - a.totalExperienceYears;
      }
      if (sortBy === 'name_asc') {
        return a.candidateName.localeCompare(b.candidateName);
      }
      return 0;
    });

    return result;
  }, [candidates, searchQuery, statusFilter, sortBy, minExpFilter]);

  // Ranked order with rank index
  const rankedList = useMemo(() => {
    const sortedAll = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
    const rankMap = new Map<string, number>();
    sortedAll.forEach((c, idx) => rankMap.set(c.id, idx + 1));

    return filteredCandidates.map((c) => ({
      ...c,
      rank: rankMap.get(c.id) || 1,
    }));
  }, [candidates, filteredCandidates]);

  // Highest matching candidate (#1)
  const topCandidate = useMemo(() => {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.matchScore - a.matchScore)[0];
  }, [candidates]);

  // Statistics
  const stats = useMemo(() => {
    const total = candidates.length;
    const shortlisted = candidates.filter(
      (c) => c.shortlistStatus === 'shortlisted' || c.matchScore >= 80
    ).length;
    const review = candidates.filter(
      (c) => c.shortlistStatus === 'review' || (c.matchScore >= 60 && c.matchScore < 80)
    ).length;
    const rejected = candidates.filter(
      (c) => c.shortlistStatus === 'rejected' || c.matchScore < 60
    ).length;
    const avgScore = total > 0 ? Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / total) : 0;

    return { total, shortlisted, review, rejected, avgScore };
  }, [candidates]);

  // Multi-Selection helpers
  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map((c) => c.id));
    }
  };

  const selectedCandidatesObjects = useMemo(() => {
    return candidates.filter((c) => selectedCandidateIds.includes(c.id));
  }, [candidates, selectedCandidateIds]);

  // Guaranteed email helper
  const getCandidateEmail = (candidate: CandidateResult) => {
    if (candidate.email && candidate.email.includes('@')) {
      return candidate.email;
    }
    const cleanName = candidate.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    return `${cleanName}@candidate-mail.com`;
  };

  const copyEmail = (candidateId: string, email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmailId(candidateId);
    setTimeout(() => setCopiedEmailId(null), 1800);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-800 bg-emerald-50 border-emerald-300';
    if (score >= 60) return 'text-amber-800 bg-amber-50 border-amber-300';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    return 'from-rose-500 to-red-500';
  };

  const isAllVisibleSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedCandidateIds.includes(c.id));

  // If no candidates exist yet, do not render this section (HR uploads resumes via Resume Intake above)
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div id="candidate-leaderboard-section" className="rounded-2xl border-2 border-blue-200/90 bg-white/95 backdrop-blur-xs p-5 sm:p-6 shadow-sm space-y-6 font-['Inter']">
      {/* Explicit Dedicated Vacancy Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 font-['Plus_Jakarta_Sans'] flex flex-wrap items-center gap-2">
            <span>Candidate Screening & Ranking Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Role: {currentVacancy.title}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated applicant evaluation pool for <strong>{currentVacancy.title}</strong> ({currentVacancy.department}) • Req: {currentVacancy.minExperienceYears}+ yrs experience
          </p>
        </div>

        <div className="flex items-center gap-2">
          {candidates.length > 0 && onClearAllCandidates && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to clear all ${candidates.length} screening results for "${currentVacancy.title}"?`)) {
                  onClearAllCandidates();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
              title="Clear all screened candidates for this vacancy"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Screening Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white shadow-2xs">
          <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            Total Resumes
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-['Plus_Jakarta_Sans']">
            {stats.total}
          </div>
          <div className="text-[10px] text-blue-700/80 mt-0.5 font-medium">Uploaded for this job</div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            Shortlisted (≥80%)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-['Plus_Jakarta_Sans']">
            {stats.shortlisted}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5 font-medium">Ready for interview</div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-white shadow-2xs">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Review / Hold (60-79%)
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-['Plus_Jakarta_Sans']">
            {stats.review}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5 font-medium">Partial alignment</div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-white shadow-2xs">
          <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
            Low Match (&lt;60%)
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-['Plus_Jakarta_Sans']">
            {stats.rejected}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-0.5 font-medium">Below benchmarks</div>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
            Avg Match Score
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1 font-['Plus_Jakarta_Sans']">
            {stats.avgScore}%
          </div>
          <div className="text-[10px] text-blue-700/80 mt-0.5 font-medium">Vacancy requirement fit</div>
        </div>
      </div>

      {/* Top Match Spotlight Hero Card */}
      {topCandidate && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50/70 via-white to-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Candidate Info & Highlights */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  TOP RECOMMENDED MATCH (#{topCandidate.rank || 1})
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {topCandidate.currentTitle}
                </span>
              </div>

              <h3
                onClick={() => onSelectCandidate(topCandidate)}
                className="text-xl sm:text-2xl font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer font-['Plus_Jakarta_Sans']"
              >
                {topCandidate.candidateName}
              </h3>

              {/* Email & Contact Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 font-semibold text-blue-800 shadow-2xs">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{getCandidateEmail(topCandidate)}</span>
                  <button
                    type="button"
                    onClick={(e) => copyEmail(topCandidate.id, getCandidateEmail(topCandidate), e)}
                    className="text-slate-400 hover:text-blue-700 ml-1 cursor-pointer"
                    title="Copy candidate email"
                  >
                    {copiedEmailId === topCandidate.id ? (
                      <span className="text-emerald-600 text-[10px] font-bold">✓ Copied</span>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>

                <span className="font-bold text-slate-900">
                  {topCandidate.totalExperienceYears} yrs experience
                </span>
                {topCandidate.totalExperienceYears >= currentVacancy.minExperienceYears ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Meets {currentVacancy.minExperienceYears}+ yrs requirement
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold">
                    ⚠ Below {currentVacancy.minExperienceYears} yrs requirement
                  </span>
                )}

                {topCandidate.folderName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    📁 {topCandidate.folderName}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 max-w-2xl line-clamp-2 leading-relaxed">
                {topCandidate.executiveSummary}
              </p>

              {/* Matched Skills highlights */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600">Matched Criteria:</span>
                {topCandidate.matchedRequirements.slice(0, 4).map((mr, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {mr.requirement}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Score Ring & Direct Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-800">
                    Match Confidence
                  </div>
                  <div className="text-xs text-slate-500">Requirement Weighted</div>
                </div>
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white border-2 border-emerald-500 shadow-xs">
                  <div className="text-center">
                    <span className="text-2xl font-black text-emerald-700 leading-none">
                      {topCandidate.matchScore}%
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">
                      Match
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onShootEmail && (
                  <button
                    type="button"
                    onClick={() => onShootEmail(topCandidate, 'shortlist')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                    title="Shoot Shortlist Email to Top Match"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Shoot Shortlist Email</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => downloadCandidateResume(topCandidate)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs transition-all cursor-pointer"
                  title="Download Top Candidate's Resume"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Resume</span>
                </button>

                <button
                  onClick={() => onSelectCandidate(topCandidate)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Inspect Audit Dossier</span>
                </button>

                {onDeleteCandidate && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove candidate "${topCandidate.candidateName}" from screening results?`)) {
                        onDeleteCandidate(topCandidate.id);
                      }
                    }}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                    title="Remove candidate from results"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search, and Bulk Selection Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex flex-1 items-center gap-3">
            {/* Master Select All Checkbox */}
            {candidates.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                title={isAllVisibleSelected ? 'Deselect all candidates' : 'Select all visible candidates'}
              >
                {isAllVisibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden sm:inline">Select All</span>
              </button>
            )}

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name, email, skill, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Status Tabs */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({candidates.length})
              </button>
              <button
                onClick={() => setStatusFilter('shortlisted')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                  statusFilter === 'shortlisted'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Shortlisted ({stats.shortlisted})
              </button>
              <button
                onClick={() => setStatusFilter('review')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                  statusFilter === 'review'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Review ({stats.review})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-bold ${
                  statusFilter === 'rejected'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Low Match ({stats.rejected})
              </button>
            </div>
          </div>

          {/* Right Controls: Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
              >
                <option value="match_desc">Highest Match First</option>
                <option value="exp_desc">Most Experience</option>
                <option value="name_asc">Candidate Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar when Candidates are Selected */}
        {selectedCandidateIds.length > 0 && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs">
                {selectedCandidateIds.length}
              </span>
              <div>
                <span className="text-xs font-bold text-white">
                  {selectedCandidateIds.length} Applicants Selected
                </span>
                <span className="text-[11px] text-slate-300 block">
                  Shoot personalized emails or apply batch actions
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Shortlist Email Button */}
              {onShootBulkEmail && (
                <button
                  type="button"
                  onClick={() => onShootBulkEmail(selectedCandidatesObjects, 'shortlist')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                  title="Shoot personalized shortlist emails to all selected candidates"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Shoot Shortlist Email ({selectedCandidateIds.length})</span>
                </button>
              )}

              {/* Bulk Rejection Email Button */}
              {onShootBulkEmail && (
                <button
                  type="button"
                  onClick={() => onShootBulkEmail(selectedCandidatesObjects, 'rejection')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all cursor-pointer"
                  title="Shoot standard rejection emails to all selected candidates"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Shoot Rejection Email ({selectedCandidateIds.length})</span>
                </button>
              )}

              {onOpenCompare && selectedCandidateIds.length >= 2 && (
                <button
                  type="button"
                  onClick={onOpenCompare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </button>
              )}

              {/* Bulk Download Resumes Button */}
              <button
                type="button"
                onClick={() => {
                  selectedCandidatesObjects.forEach((c, idx) => {
                    setTimeout(() => downloadCandidateResume(c), idx * 250);
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer"
                title="Download resumes of all selected candidates"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Resumes ({selectedCandidateIds.length})</span>
              </button>

              {onDeleteBulkCandidates && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete ${selectedCandidateIds.length} selected candidates?`)) {
                      onDeleteBulkCandidates(selectedCandidateIds);
                      setSelectedCandidateIds([]);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedCandidateIds([])}
                className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Ranking List */}
      <div className="space-y-3">
        {rankedList.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-blue-200 bg-white space-y-2">
            <Search className="w-6 h-6 text-blue-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No candidates match your filter</h4>
            <p className="text-xs text-slate-500">Try adjusting your keyword or status criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setMinExpFilter(0);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer pt-1"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          rankedList.map((candidate) => {
            const isTop = candidate.rank === 1;
            const isSelected = selectedCandidateIds.includes(candidate.id);
            const meetsExp = candidate.totalExperienceYears >= currentVacancy.minExperienceYears;
            const candidateEmail = getCandidateEmail(candidate);

            return (
              <div
                key={candidate.id}
                className={`group relative rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50/20 shadow-xs'
                    : isTop
                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/40 via-white to-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Selection Checkbox + Rank + Candidate Details */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Checkbox & Rank */}
                    <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          toggleSelectCandidate(candidate.id);
                          onToggleCompare(candidate.id);
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-4 w-4"
                        title="Select candidate for bulk email or compare"
                      />
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          candidate.rank === 1
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : candidate.rank === 2
                            ? 'bg-slate-800 text-white'
                            : candidate.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        #{candidate.rank}
                      </span>
                    </div>

                    {/* Candidate Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => onSelectCandidate(candidate)}
                          className="font-extrabold text-base text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                        >
                          {candidate.candidateName}
                        </h4>

                        <span className="text-xs text-slate-500 font-medium">
                          {candidate.currentTitle}
                        </span>

                        {isTop && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            TOP MATCH
                          </span>
                        )}

                        {/* Email Dispatch History Status Badge */}
                        {candidate.lastEmailType && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              candidate.lastEmailType === 'shortlist'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                            title={`Email sent at ${candidate.emailSentAt || 'recently'}`}
                          >
                            <Mail className="w-3 h-3" />
                            <span>
                              {candidate.lastEmailType === 'shortlist'
                                ? 'Shortlist Email Sent'
                                : 'Rejection Notice Sent'}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Candidate Email Strip (Always Included) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 font-semibold group-hover:border-blue-300">
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono text-[11px] text-blue-900">{candidateEmail}</span>
                          <button
                            type="button"
                            onClick={(e) => copyEmail(candidate.id, candidateEmail, e)}
                            className="text-slate-400 hover:text-blue-700 ml-0.5 cursor-pointer"
                            title="Copy candidate email"
                          >
                            {copiedEmailId === candidate.id ? (
                              <span className="text-emerald-600 text-[10px] font-bold">✓</span>
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>

                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-800">{candidate.totalExperienceYears}y exp</strong>
                          {meetsExp ? (
                            <span className="text-emerald-700 font-bold text-[11px] ml-1">
                              ✓ Meets {currentVacancy.minExperienceYears}y req
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold text-[11px] ml-1">
                              ⚠ Req: {currentVacancy.minExperienceYears}y
                            </span>
                          )}
                        </span>

                        {candidate.educationSummary && (
                          <span className="hidden sm:inline text-slate-500 truncate max-w-xs text-[11px]">
                            • {candidate.educationSummary}
                          </span>
                        )}

                        {candidate.folderName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            📁 {candidate.folderName}
                          </span>
                        )}
                      </div>

                      {/* Requirement Match Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {candidate.matchedRequirements.slice(0, 3).map((mr, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                            title={`Matched: ${mr.evidence}`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[150px]">{mr.requirement}</span>
                          </span>
                        ))}

                        {candidate.missingRequirements.slice(0, 2).map((ms, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200"
                            title={`Missing: ${ms.details}`}
                          >
                            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[150px]">{ms.requirement}</span>
                          </span>
                        ))}

                        {candidate.matchedRequirements.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            +{candidate.matchedRequirements.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Match Score & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 shrink-0">
                    {/* Score Bar Breakdown */}
                    <div className="space-y-1 sm:w-36 shrink-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">Match Score</span>
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded border ${getScoreBadgeColor(
                            candidate.matchScore
                          )}`}
                        >
                          {candidate.matchScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(
                            candidate.matchScore
                          )} transition-all duration-300`}
                          style={{ width: `${candidate.matchScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                        <span>Skills: {candidate.skillsMatchScore}%</span>
                        <span>Exp: {candidate.experienceMatchScore}%</span>
                      </div>
                    </div>

                    {/* Action Buttons: Shortlist Email, Reject Email, Details, Delete */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Shortlist & Email Trigger Button */}
                      {onShootEmail && (
                        <button
                          type="button"
                          onClick={() => onShootEmail(candidate, 'shortlist')}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs ${
                            candidate.shortlistStatus === 'shortlisted'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300'
                          }`}
                          title={`Shoot Shortlist Email to ${candidate.candidateName}`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Shortlist & Email</span>
                        </button>
                      )}

                      {/* Reject & Email Trigger Button */}
                      {onShootEmail && (
                        <button
                          type="button"
                          onClick={() => onShootEmail(candidate, 'rejection')}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs ${
                            candidate.shortlistStatus === 'rejected'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300'
                          }`}
                          title={`Shoot Standard Rejection Email to ${candidate.candidateName}`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject & Email</span>
                        </button>
                      )}

                      {/* Download Resume Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadCandidateResume(candidate);
                        }}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-300 hover:border-blue-300 shadow-2xs transition-colors cursor-pointer"
                        title={`Download ${candidate.candidateName}'s Resume`}
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Resume</span>
                      </button>

                      {/* Details Button */}
                      <button
                        onClick={() => onSelectCandidate(candidate)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                        title="View complete candidate dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Audit</span>
                      </button>

                      {/* Delete Button */}
                      {onDeleteCandidate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove candidate "${candidate.candidateName}" from screening results?`)) {
                              onDeleteCandidate(candidate.id);
                            }
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                          title="Remove this candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
