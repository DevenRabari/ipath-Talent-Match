import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Clock,
  MapPin,
  CheckCircle2,
  Edit3,
  PlusCircle,
  Archive,
  RotateCcw,
  Database,
  Eye,
  X,
  Layers,
  ShieldCheck,
  Check,
  Users,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { JobDescription, CandidateResult } from '../types';

interface JobVacancyBarProps {
  vacancies: JobDescription[];
  currentVacancy: JobDescription;
  candidatesCountMap: Record<string, number>;
  candidates?: CandidateResult[];
  allCandidatesMap?: Record<string, CandidateResult[]>;
  onSelectVacancy: (vacancy: JobDescription) => void;
  onEditVacancy: () => void;
  onOpenNewVacancy: () => void;
  onArchiveVacancy?: (vacancyId: string) => void;
  onReactivateVacancy?: (vacancyId: string) => void;
  onDeleteVacancy?: (vacancyId: string) => void;
  onTriggerUploadForVacancy?: (vacancy: JobDescription) => void;
}

export const JobVacancyBar: React.FC<JobVacancyBarProps> = ({
  vacancies,
  currentVacancy,
  candidatesCountMap,
  candidates = [],
  allCandidatesMap = {},
  onSelectVacancy,
  onEditVacancy,
  onOpenNewVacancy,
  onArchiveVacancy,
  onReactivateVacancy,
  onDeleteVacancy,
}) => {
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');
  const [vacancyToArchive, setVacancyToArchive] = useState<JobDescription | null>(null);

  // Current vacancy candidate screening breakdown
  const currentVacancyCandidates = (candidates && candidates.length > 0)
    ? candidates
    : (allCandidatesMap[currentVacancy?.id] || []);
  const currentTotalAnalyzed = currentVacancyCandidates.length;
  const currentShortlistedCount = currentVacancyCandidates.filter(
    (c) => c.shortlistStatus === 'shortlisted' || c.matchScore >= 80
  ).length;
  const currentUnderReviewCount = Math.max(0, currentTotalAnalyzed - currentShortlistedCount);
  const currentConversionRate = currentTotalAnalyzed > 0
    ? Math.round((currentShortlistedCount / currentTotalAnalyzed) * 100)
    : 0;

  // Strict separation of active vs archived
  const activeVacancies = vacancies.filter((v) => v.status !== 'archived');
  const archivedVacancies = vacancies.filter((v) => v.status === 'archived');

  // When switching to Active tab or when current vacancy is archived,
  // automatically select an active vacancy so archived NEVER shows under Active vacancy
  useEffect(() => {
    if (viewTab === 'active' && currentVacancy.status === 'archived' && activeVacancies.length > 0) {
      onSelectVacancy(activeVacancies[0]);
    }
  }, [viewTab, currentVacancy.status, activeVacancies, onSelectVacancy]);

  const handleConfirmArchive = () => {
    if (vacancyToArchive && onArchiveVacancy) {
      onArchiveVacancy(vacancyToArchive.id);
      setVacancyToArchive(null);
    }
  };

  const handleReactivateAndSwitch = (vacancyId: string) => {
    if (onReactivateVacancy) {
      onReactivateVacancy(vacancyId);
      setViewTab('active');
    }
  };

  return (
    <div className="relative rounded-2xl border-2 border-blue-200/90 bg-white/95 backdrop-blur-xs p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Header: Title + Tab Switcher + Create Vacancy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-['Plus_Jakarta_Sans']">
              Job Vacancy Management
            </h2>
          </div>

          {/* Sub Tabs: Active Vacancies vs Backend Archive */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setViewTab('active');
                if (currentVacancy.status === 'archived' && activeVacancies.length > 0) {
                  onSelectVacancy(activeVacancies[0]);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'active'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50/80 hover:bg-blue-100/70 text-blue-900 border border-blue-200'
              }`}
            >
              <span>Active Vacancies</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewTab === 'active' ? 'bg-white/20 text-white' : 'bg-blue-200/80 text-blue-900'
                }`}
              >
                {activeVacancies.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('archived')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'archived'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-100/60 text-amber-900 border border-amber-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived in Backend</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewTab === 'archived' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-950'
                }`}
              >
                {archivedVacancies.length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenNewVacancy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Create New Vacancy Profile</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE VACANCIES (Archived vacancies NEVER appear here) */}
      {viewTab === 'active' && (
        <div className="space-y-4">
          {activeVacancies.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-blue-50/60 border border-dashed border-blue-300 space-y-3">
              <Briefcase className="w-8 h-8 text-blue-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Active Vacancies</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                All vacancies have been safely archived in the backend repository. You can reactivate an archived vacancy from the "Archived in Backend" tab or create a new vacancy profile.
              </p>
              <button
                type="button"
                onClick={onOpenNewVacancy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create New Vacancy Profile</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 px-0.5">
                <span className="font-bold text-slate-800">
                  Select an Active Job Role ({activeVacancies.length} Active):
                </span>
                <span className="text-[11px] text-slate-500">
                  Click any vacancy to inspect criteria or screen candidates
                </span>
              </div>

              {/* Active Vacancies Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeVacancies.map((v) => {
                  const isSelected = currentVacancy?.id === v.id;
                  const vCandidates = allCandidatesMap[v.id] || (v.id === currentVacancy?.id ? (candidates || []) : []);
                  const totalCount = vCandidates.length || candidatesCountMap[v.id] || 0;
                  const vShortlisted = vCandidates.filter(
                    (c) => c.shortlistStatus === 'shortlisted' || c.matchScore >= 80
                  ).length;

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVacancy(v)}
                      className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-gradient-to-br from-blue-50/90 to-sky-50/70 shadow-xs ring-2 ring-blue-500/20'
                          : 'border border-blue-200/90 bg-white hover:bg-blue-50/40 hover:border-blue-400 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Status badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {isSelected ? 'Active Selection' : 'Active Role'}
                          </span>

                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-blue-100/90 text-blue-900 border border-blue-200">
                            <span>{totalCount} {totalCount === 1 ? 'Applicant' : 'Applicants'}</span>
                            <span className="text-blue-300">•</span>
                            <span className="text-emerald-800 font-bold">{vShortlisted} Shortlisted</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 font-['Plus_Jakarta_Sans']">
                          {v.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1">
                          <span className="font-medium">{v.department}</span>
                          <span>•</span>
                          <span>{v.location}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-700">{v.minExperienceYears}+ yrs exp</span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {v.shortSummary}
                        </p>
                      </div>

                      {/* Card Actions: Quick Select, Edit, and Archive */}
                      <div className="pt-3 mt-3 border-t border-blue-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVacancy(v);
                          }}
                          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isSelected ? 'Currently Viewing' : 'Select Role'}
                        </button>

                        {/* Archive button */}
                        {onArchiveVacancy && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVacancyToArchive(v);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                            title="Remove from active vacancies and keep in backend archive"
                          >
                            <Archive className="w-3 h-3 text-amber-700" />
                            <span>Archive</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dedicated Active Vacancy Criteria Specs Box (ONLY shown if current vacancy is ACTIVE) */}
          {currentVacancy && currentVacancy.status !== 'archived' && (
            <div className="p-5 rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-indigo-50/40 space-y-4 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-blue-200/80">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Active Screening Profile
                    </span>
                    <span className="text-xs text-blue-300">•</span>
                    <span className="text-xs text-slate-700 font-bold">{currentVacancy.department}</span>
                    <span className="text-xs text-blue-300">•</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {currentVacancy.location}
                    </span>
                    <span className="text-xs text-blue-300">•</span>
                    <span className="text-xs text-slate-600 font-medium">{currentVacancy.employmentType}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                    {currentVacancy.title}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{currentVacancy.shortSummary}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onEditVacancy}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Title & Criteria</span>
                  </button>

                  {/* Option to archive and move to backend */}
                  {onArchiveVacancy && (
                    <button
                      type="button"
                      onClick={() => setVacancyToArchive(currentVacancy)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                      title="Remove from active vacancies and keep safely in backend repository"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-700" />
                      <span>Archive / Move to Backend</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated Applicant and Shortlisted Screening Intelligence Tabs */}
              <div className="p-4 rounded-xl border border-blue-200/90 bg-white/95 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                        <span>Applicant & Shortlist Screening Dashboard</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200 lowercase">
                          for {currentVacancy.title}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Tracks how many candidate resumes/CVs have been analyzed and shortlisted for this specific role
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                    Shortlist Benchmark: Score ≥ 80% or HR Approved
                  </span>
                </div>

                {/* 3 Prominent Stat Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tab 1: Applicants / Resumes / CVs Analyzed */}
                  <div
                    onClick={() => {
                      if (currentTotalAnalyzed > 0) {
                        document.getElementById('candidate-leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        document.getElementById('upload-screening-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/70 to-white hover:border-blue-400 transition-all cursor-pointer shadow-2xs group"
                    title="Total resumes/CVs parsed and scored against this vacancy"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                        Applicants / CVs Analyzed
                      </span>
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {currentTotalAnalyzed}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {currentTotalAnalyzed === 0
                        ? '0 resumes evaluated yet'
                        : `${currentTotalAnalyzed} ${currentTotalAnalyzed === 1 ? 'candidate CV' : 'candidate CVs'} screened`}
                    </div>
                  </div>

                  {/* Tab 2: Shortlisted from It */}
                  <div
                    onClick={() => {
                      if (currentTotalAnalyzed > 0) {
                        document.getElementById('candidate-leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-500 transition-all cursor-pointer shadow-2xs group"
                    title="Candidates meeting or exceeding matching benchmark (Score ≥ 80% or HR shortlisted)"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                          Shortlisted from It
                        </span>
                        {currentTotalAnalyzed > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-950">
                            {currentConversionRate}%
                          </span>
                        )}
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-900 mt-1">
                      {currentShortlistedCount}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      {currentShortlistedCount === 0
                        ? '0 shortlisted from pool'
                        : `${currentShortlistedCount} qualified for interview discussions`}
                    </div>
                  </div>

                  {/* Tab 3: Under Review / Pending Assessment */}
                  <div
                    onClick={() => {
                      if (currentTotalAnalyzed > 0) {
                        document.getElementById('candidate-leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/70 to-white hover:border-slate-400 transition-all cursor-pointer shadow-2xs group"
                    title="Candidates in secondary review or below the 80% threshold"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        Under Review / Secondary
                      </span>
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {currentUnderReviewCount}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {currentTotalAnalyzed === 0
                        ? 'Awaiting resume uploads'
                        : `${currentUnderReviewCount} candidate profiles in evaluation`}
                    </div>
                  </div>
                </div>

                {/* Sub-footer breakdown & actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  {currentTotalAnalyzed > 0 ? (
                    <>
                      <span className="text-slate-600 font-medium">
                        Screening Results: <strong className="text-emerald-700 font-bold">{currentShortlistedCount} shortlisted</strong> out of <strong className="text-slate-800">{currentTotalAnalyzed} applicants</strong> ({currentConversionRate}% conversion rate)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('candidate-leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>View Candidate Evaluation Leaderboard below</span>
                        <span>↓</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 italic">
                        No candidate resumes uploaded for this role yet. Upload candidate resumes in the section below to automatically parse and rank candidates.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('upload-screening-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>Go to Resume Upload Section</span>
                        <span>↓</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Structured Criteria Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Min Experience */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-blue-200/90 shadow-2xs">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Required Experience
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {currentVacancy.minExperienceYears}+ Years Professional
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Strictly calculated from candidate career dates
                    </div>
                  </div>
                </div>

                {/* Core Required Skills */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-blue-200/90 shadow-2xs md:col-span-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {(() => {
                      const coreCount = currentVacancy.coreRequiredSkills.length;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Must-Have Core Skills ({coreCount} of 5)
                            </div>
                            <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              Core Requirements ({coreCount} Added)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {currentVacancy.coreRequiredSkills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs"
                              >
                                <span className="text-[10px] text-emerald-700 font-black">#{i + 1}</span>
                                <span>{skill}</span>
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Preferred & Education */}
              <div className="pt-2 border-t border-blue-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700">Preferred Skills (Unlimited):</span>
                  {currentVacancy.preferredSkills.slice(0, 5).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 border border-blue-200 text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {currentVacancy.preferredSkills.length > 5 && (
                    <span className="text-slate-500 text-[11px] font-semibold">
                      +{currentVacancy.preferredSkills.length - 5} more
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-semibold">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Education Benchmark: {currentVacancy.educationRequirement}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ARCHIVED IN BACKEND (Preserved for future screening) */}
      {viewTab === 'archived' && (
        <div className="space-y-4">
          {/* Informational banner about backend preservation */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-amber-300 uppercase tracking-wider text-xs block font-['Plus_Jakarta_Sans']">
                  Backend Vacancy Archive & Talent Repository
                </span>
                <span className="text-slate-300 text-xs">
                  These job vacancies have been removed from the active hiring board but are{' '}
                  <strong className="text-white">securely preserved in the backend</strong>. You can reactivate them back
                  to the active pipeline anytime or open them to screen and evaluate candidate pools.
                </span>
              </div>
            </div>
          </div>

          {archivedVacancies.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-amber-50/50 border border-dashed border-amber-300 space-y-2">
              <Archive className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Archived Vacancies Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When you archive an active vacancy, it is removed from the active board and safely stored here. All extracted criteria, required skills, and candidate scoring history will be kept ready for future screening.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {archivedVacancies.map((v) => {
                const count = candidatesCountMap[v.id] || 0;
                const isCurrentlySelected = currentVacancy.id === v.id;

                return (
                  <div
                    key={v.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${
                      isCurrentlySelected
                        ? 'border-2 border-amber-500 bg-amber-50/60 shadow-xs'
                        : 'border border-amber-200 bg-white hover:bg-amber-50/40 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Archive className="w-3 h-3 text-amber-700" />
                          Archived in Backend
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-200 text-slate-700">
                          {count} {count === 1 ? 'Candidate' : 'Candidates'}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">{v.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{v.department}</span>
                        <span>•</span>
                        <span>{v.location}</span>
                        <span>•</span>
                        <span>{v.minExperienceYears}+ yrs exp</span>
                      </div>

                      {v.archivedAt && (
                        <div className="text-[10px] text-slate-400 mt-2">
                          Archived on: {new Date(v.archivedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Actions: Reactivate or Open & Screen */}
                    <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {onReactivateVacancy && (
                          <button
                            type="button"
                            onClick={() => handleReactivateAndSwitch(v.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
                            title="Restore this vacancy back to the active hiring board"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivate to Active</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectVacancy(v);
                            document.getElementById('upload-screening-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer"
                          title="Open this vacancy to review or screen candidate pools"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Screen</span>
                        </button>
                      </div>

                      {onDeleteVacancy && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Permanently delete "${v.title}" from backend? This will delete all saved criteria.`
                              )
                            ) {
                              onDeleteVacancy(v.id);
                            }
                          }}
                          className="text-[11px] text-slate-400 hover:text-rose-600 text-center py-0.5 transition-colors cursor-pointer"
                        >
                          Delete permanently from backend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Archived Criteria Specifications Preview if currently selected */}
          {currentVacancy && currentVacancy.status === 'archived' && (
            <div className="p-5 rounded-xl border border-amber-300 bg-amber-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Archive className="w-3.5 h-3.5 text-amber-700" />
                    Viewing Archived Role (Preserved in Backend)
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1 font-['Plus_Jakarta_Sans']">
                    {currentVacancy.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">{currentVacancy.shortSummary}</p>
                </div>

                {onReactivateVacancy && (
                  <button
                    type="button"
                    onClick={() => handleReactivateAndSwitch(currentVacancy.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reactivate to Active Board</span>
                  </button>
                )}
              </div>

              {/* Criteria cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-700 block">Experience Requirement:</span>
                  <span className="text-slate-900 font-extrabold text-sm">{currentVacancy.minExperienceYears}+ Years</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-700 block">Core Skills:</span>
                  <span className="text-slate-900 font-medium">{currentVacancy.coreRequiredSkills.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {vacancyToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <Archive className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setVacancyToArchive(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                Remove from Active Board & Archive?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to remove <strong className="text-slate-900">"{vacancyToArchive.title}"</strong> from the active vacancies list. Once archived, it will <strong className="text-amber-800">not show under Active Vacancies</strong>.
              </p>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Database className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kept Safely in Backend Repository:</span>
                </div>
                <ul className="list-disc pl-5 text-slate-600 text-[11px] space-y-0.5">
                  <li>All extracted job requirements and skills remain preserved.</li>
                  <li>
                    {candidatesCountMap[vacancyToArchive.id] || 0} candidate screening records remain safely saved.
                  </li>
                  <li>You can reactivate it anytime back to the active board.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVacancyToArchive(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive & Keep in Backend</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
