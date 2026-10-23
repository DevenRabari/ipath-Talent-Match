import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Briefcase,
  Layers,
  Check,
  AlertCircle,
  FileText,
  Copy,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sliders,
  MapPin,
  ListPlus,
  Building2,
  Trash2,
} from 'lucide-react';
import { JobDescription } from '../types';

interface JobVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVacancy: (vacancy: JobDescription) => void;
  vacancyToEdit?: JobDescription | null;
}

const POLICY_DROPDOWN_OPTIONS = [
  'Remote / Hybrid',
  'On-site',
  'Hybrid',
  'Remote',
  'Flexible',
  'Custom Location / Office',
];

export const JobVacancyModal: React.FC<JobVacancyModalProps> = ({
  isOpen,
  onClose,
  onSaveVacancy,
  vacancyToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'ai_extract' | 'manual'>('ai_extract');
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');

  // Department State (no preloaded departments; persisted in localStorage and added via popup)
  const [savedDepartments, setSavedDepartments] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ipath_custom_departments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [department, setDepartment] = useState('');
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);
  
  // Location & Policy state
  const [locationPolicy, setLocationPolicy] = useState('Remote / Hybrid');
  const [locationCity, setLocationCity] = useState('');
  
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [minExperienceYears, setMinExperienceYears] = useState<number>(3);
  
  // Core Skills (Must have at least 5 for 50% strict weightage)
  const [coreSkills, setCoreSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newCoreSkill, setNewCoreSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  
  // 5-Slot Batch Builder State
  const [showFiveSlotsBuilder, setShowFiveSlotsBuilder] = useState(false);
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [slot4, setSlot4] = useState('');
  const [slot5, setSlot5] = useState('');

  const [education, setEducation] = useState("Bachelor's Degree or equivalent");
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [shortSummary, setShortSummary] = useState('');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Refs for programmatic selection
  const titleInputRef = useRef<HTMLInputElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rawTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to decompose existing location string into policy and optional city
  const parseLocationString = (locStr: string) => {
    const trimmed = (locStr || '').trim();
    if (!trimmed) return { policy: 'Remote / Hybrid', city: '' };

    // Direct matches
    for (const opt of ['Remote / Hybrid', 'On-site', 'Hybrid', 'Remote', 'Flexible']) {
      if (trimmed.toLowerCase() === opt.toLowerCase()) {
        return { policy: opt, city: '' };
      }
    }

    // Prefixes like "Hybrid (Ahmedabad)" or "On-site - New York"
    for (const opt of ['Remote / Hybrid', 'On-site', 'Hybrid', 'Remote', 'Flexible']) {
      if (trimmed.toLowerCase().startsWith(opt.toLowerCase())) {
        const rest = trimmed.slice(opt.length).replace(/^[\s(-:]+/, '').replace(/[)]+$/, '').trim();
        return { policy: opt, city: rest };
      }
    }

    return { policy: 'Custom Location / Office', city: trimmed };
  };

  useEffect(() => {
    if (vacancyToEdit) {
      setTitle(vacancyToEdit.title);
      setDepartment(vacancyToEdit.department);

      // Ensure vacancyToEdit department stays in savedDepartments
      if (vacancyToEdit.department && !savedDepartments.includes(vacancyToEdit.department)) {
        const updated = [...savedDepartments, vacancyToEdit.department];
        setSavedDepartments(updated);
        try {
          localStorage.setItem('ipath_custom_departments', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      
      const parsedLoc = parseLocationString(vacancyToEdit.location);
      setLocationPolicy(parsedLoc.policy);
      setLocationCity(parsedLoc.city);

      setEmploymentType(vacancyToEdit.employmentType);
      setMinExperienceYears(vacancyToEdit.minExperienceYears);
      setCoreSkills(vacancyToEdit.coreRequiredSkills || []);
      setPreferredSkills(vacancyToEdit.preferredSkills || []);
      setEducation(vacancyToEdit.educationRequirement || '');
      setResponsibilities(vacancyToEdit.responsibilities || []);
      setShortSummary(vacancyToEdit.shortSummary || '');
      setActiveTab('manual');
      setValidationWarning(null);
    } else {
      resetForm();
    }
  }, [vacancyToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDepartment(savedDepartments[0] || '');
    setLocationPolicy('Remote / Hybrid');
    setLocationCity('');
    setEmploymentType('Full-time');
    setMinExperienceYears(3);
    // Start completely clean - no preloaded skills so HR adds manually
    setCoreSkills([]);
    setPreferredSkills([]);
    setSlot1('');
    setSlot2('');
    setSlot3('');
    setSlot4('');
    setSlot5('');
    setEducation("Bachelor's Degree or equivalent experience");
    setResponsibilities([]);
    setShortSummary('');
    setRawText('');
    setExtractError(null);
    setValidationWarning(null);
    setShowFiveSlotsBuilder(false);
    setActiveTab('manual');
  };

  // Helper for guaranteed Ctrl+A / Cmd+A text selection across iframes
  const handleKeyDownSelectAll = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      e.stopPropagation();
      e.currentTarget.select();
    }
  };

  if (!isOpen) return null;

  // Dynamic core skills count (up to 5)
  const coreCount = coreSkills.length;

  // Compute final location string
  const getResolvedLocation = () => {
    if (locationPolicy === 'Custom Location / Office') {
      return locationCity.trim() || 'Custom Office';
    }
    if (locationCity.trim()) {
      return `${locationPolicy} (${locationCity.trim()})`;
    }
    return locationPolicy;
  };

  const handleExtractWithAI = async () => {
    if (!rawText.trim()) {
      setExtractError('Please paste your job posting text or LinkedIn vacancy copy first.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/extract-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract requirements from text');
      }

      const data = await response.json();
      setTitle(data.title || 'Extracted Role');
      setDepartment(data.department || 'General');
      
      if (data.location) {
        const parsed = parseLocationString(data.location);
        setLocationPolicy(parsed.policy);
        setLocationCity(parsed.city);
      }
      
      if (data.employmentType) setEmploymentType(data.employmentType);
      if (typeof data.minExperienceYears === 'number') {
        setMinExperienceYears(data.minExperienceYears);
      }
      if (Array.isArray(data.coreRequiredSkills) && data.coreRequiredSkills.length > 0) {
        setCoreSkills(data.coreRequiredSkills);
      }
      if (Array.isArray(data.preferredSkills)) {
        setPreferredSkills(data.preferredSkills);
      }
      if (data.educationRequirement) {
        setEducation(data.educationRequirement);
      }
      if (Array.isArray(data.responsibilities) && data.responsibilities.length > 0) {
        setResponsibilities(data.responsibilities);
      }
      if (data.shortSummary) {
        setShortSummary(data.shortSummary);
      }

      setActiveTab('manual');
    } catch (err: any) {
      console.error(err);
      setExtractError(err.message || 'Error communicating with AI extraction engine.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Add core skill (supports comma-separated multi-skill pasting, up to 5 core skills)
  const handleAddCoreSkill = () => {
    if (!newCoreSkill.trim()) return;
    if (coreSkills.length >= 5) {
      setValidationWarning('Maximum 5 core skills reached. You can add up to 5 core skills. Move extra skills to Preferred Skills.');
      return;
    }

    const splitSkills = newCoreSkill
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...coreSkills];
    for (const skill of splitSkills) {
      if (!updated.includes(skill) && updated.length < 5) {
        updated.push(skill);
      }
    }
    setCoreSkills(updated);
    setNewCoreSkill('');
    setValidationWarning(null);
  };

  const handleRemoveCoreSkill = (index: number) => {
    setCoreSkills(coreSkills.filter((_, i) => i !== index));
  };

  // 5-Slot Batch Saver (allows 1 to 5 slots)
  const handleSaveFiveSlots = () => {
    const slots = [slot1, slot2, slot3, slot4, slot5]
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (slots.length === 0) return;

    const merged = [...coreSkills];
    for (const s of slots) {
      if (!merged.includes(s) && merged.length < 5) {
        merged.push(s);
      }
    }
    setCoreSkills(merged);
    setSlot1('');
    setSlot2('');
    setSlot3('');
    setSlot4('');
    setSlot5('');
    setShowFiveSlotsBuilder(false);
    setValidationWarning(null);
  };

  // Add preferred skill (supports unlimited skills, comma-separated)
  const handleAddPrefSkill = () => {
    if (!newPrefSkill.trim()) return;
    const splitSkills = newPrefSkill
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...preferredSkills];
    for (const skill of splitSkills) {
      if (!updated.includes(skill)) {
        updated.push(skill);
      }
    }
    setPreferredSkills(updated);
    setNewPrefSkill('');
  };

  const handleRemovePrefSkill = (index: number) => {
    setPreferredSkills(preferredSkills.filter((_, i) => i !== index));
  };

  const handleSaveDepartment = () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed) {
      setDeptError('Please enter a department name.');
      return;
    }
    const existing = savedDepartments.find(
      (d) => d.toLowerCase() === trimmed.toLowerCase()
    );
    const finalName = existing || trimmed;

    if (!existing) {
      const updated = [...savedDepartments, trimmed];
      setSavedDepartments(updated);
      try {
        localStorage.setItem('ipath_custom_departments', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setDepartment(finalName);
    setNewDeptInput('');
    setDeptError(null);
    setIsAddDeptModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Up to 5 core skills permitted
    if (coreSkills.length === 0) {
      setValidationWarning(
        'Please add at least 1 Must-Have Core Skill (you can add up to 5 core skills).'
      );
      return;
    }
    if (coreSkills.length > 5) {
      setValidationWarning(
        'You can add up to 5 core skills. Please remove extra skills.'
      );
      return;
    }

    const resolvedLocation = getResolvedLocation();

    const newVacancy: JobDescription = {
      id: vacancyToEdit?.id || `vac-${Date.now()}`,
      title: title.trim(),
      department: department.trim() || 'General',
      employmentType: employmentType.trim() || 'Full-time',
      location: resolvedLocation,
      minExperienceYears: Number(minExperienceYears) || 0,
      coreRequiredSkills: coreSkills,
      preferredSkills: preferredSkills,
      educationRequirement: education.trim() || "Bachelor's Degree or relevant experience",
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute core job duties'],
      shortSummary:
        shortSummary.trim() ||
        `${title} role requiring ${minExperienceYears}+ years experience with focus on ${coreSkills.slice(0, 3).join(', ')}.`,
      createdAt: vacancyToEdit?.createdAt || new Date().toISOString(),
      status: vacancyToEdit?.status || 'active',
      archivedAt: vacancyToEdit?.archivedAt,
    };

    onSaveVacancy(newVacancy);
    onClose();
  };

  const sampleLinkedInText = `We are hiring a Senior DevOps & Cloud Infrastructure Engineer!
Location: Remote / Hybrid
Role: Full-time

About the role:
We are seeking an experienced DevOps / Cloud Platform Engineer with at least 5 years of production cloud engineering experience. You will own our AWS infrastructure, Kubernetes clusters, and Terraform infrastructure-as-code automation.

Requirements:
- 5+ years building and maintaining production AWS or GCP environments
- Deep proficiency with Kubernetes (EKS), Docker, and container orchestration
- Strong Infrastructure as Code experience using Terraform or Pulumi
- Hands-on CI/CD pipeline automation (GitHub Actions, GitLab CI)
- Scripting mastery in Python, Bash, or Go
- Solid understanding of Linux networking, security compliance, and Prometheus/Grafana monitoring

Nice-to-have:
- Experience with Kafka or message brokers
- AWS Solutions Architect Professional certification
- Experience in SOC2 compliant environments

Education:
B.S. in Computer Science, Software Engineering, or equivalent practical experience.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                {vacancyToEdit ? 'Update Vacancy Requirements' : 'Create Dedicated Vacancy Profile'}
              </h2>
              <p className="text-xs text-slate-500">
                Resumes will be matched and ranked strictly against these requirements
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('ai_extract')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai_extract'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Auto-Extract from LinkedIn / Job Post</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              Structured Requirements{' '}
              {coreSkills.length > 0 && `(${coreSkills.length} Core Skills)`}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto bg-white">
          {activeTab === 'ai_extract' ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Paste Job Description / Vacancy Copy
                  </label>
                  <div className="flex items-center gap-2">
                    {rawText && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (rawTextareaRef.current) {
                              rawTextareaRef.current.focus();
                              rawTextareaRef.current.select();
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2 py-0.5 rounded bg-blue-50 border border-blue-200"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setRawText('')}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-2 py-0.5 rounded bg-rose-50 border border-rose-200"
                        >
                          ✕ Clear All
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setRawText(sampleLinkedInText)}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer ml-1"
                    >
                      Load Sample Post
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Paste the text directly from your LinkedIn job posting or ATS. Gemini will automatically extract title, experience years, core required skills, location policy, and core responsibilities.
                </p>
                <textarea
                  ref={rawTextareaRef}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onKeyDown={handleKeyDownSelectAll}
                  placeholder="Paste LinkedIn vacancy, Job Description, or requirement specs here..."
                  rows={10}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono select-text"
                />
              </div>

              {extractError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{extractError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Skip to manual form →
                </button>

                <button
                  type="button"
                  onClick={handleExtractWithAI}
                  disabled={isExtracting || !rawText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Extracting Requirements with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract & Populate Requirements</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {validationWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="font-semibold">{validationWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Title with Clear & Select All Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Job Title *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {title && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (titleInputRef.current) {
                                titleInputRef.current.focus();
                                titleInputRef.current.select();
                              }
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-1.5 py-0.2 rounded hover:bg-blue-50"
                            title="Select All (Ctrl+A)"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setTitle('')}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-1.5 py-0.2 rounded hover:bg-rose-50"
                            title="Clear title text"
                          >
                            ✕ Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      ref={titleInputRef}
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={handleKeyDownSelectAll}
                      placeholder="e.g. Senior Full-Stack Engineer"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text"
                    />
                    {title && (
                      <button
                        type="button"
                        onClick={() => setTitle('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 cursor-pointer text-xs font-bold"
                        title="Clear title"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Department * (Select or Add New via Pop-up) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Department * (Select or Add New)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewDeptInput('');
                        setDeptError(null);
                        setIsAddDeptModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Open pop-up to add a new department"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Add Department</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {/* Department Dropdown displaying only saved departments */}
                    <div className="flex items-center gap-2">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
                      >
                        <option value="">
                          {savedDepartments.length === 0
                            ? '-- No departments yet (Click "+ Add Department" to add) --'
                            : '-- Select Department --'}
                        </option>
                        {savedDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>

                      {department && (
                        <button
                          type="button"
                          onClick={() => setDepartment('')}
                          className="px-2.5 py-2 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold cursor-pointer transition-colors shrink-0"
                          title="Clear selected department"
                        >
                          ✕ Clear
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {savedDepartments.length === 0
                        ? 'No preloaded departments. Click "+ Add Department" to create your department name; once saved, it will stay in this dropdown for all vacancies.'
                        : department
                        ? `Selected Department: ${department}`
                        : 'Choose a department from the dropdown or click "+ Add Department" to add a new one.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Min Experience, Employment Type, and Location / Policy Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Min Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={minExperienceYears}
                    onChange={(e) => setMinExperienceYears(Number(e.target.value))}
                    onKeyDown={handleKeyDownSelectAll}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Location / Policy Dropdown Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Location / Policy *
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      Dropdown Select
                    </span>
                  </div>
                  <select
                    value={locationPolicy}
                    onChange={(e) => setLocationPolicy(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-bold focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {POLICY_DROPDOWN_OPTIONS.map((policy) => (
                      <option key={policy} value={policy}>
                        {policy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional City / Hub Input & Result Preview */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {locationPolicy === 'Custom Location / Office'
                      ? 'Type Custom Office Location / Address:'
                      : 'Office City / Hub (Optional, e.g. Ahmedabad, London, New York):'}
                  </label>
                  <input
                    type="text"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    onKeyDown={handleKeyDownSelectAll}
                    placeholder={
                      locationPolicy === 'Custom Location / Office'
                        ? 'e.g. Headquarters Campus, Building 4'
                        : 'e.g. Ahmedabad, Gujarat, India (or leave blank)'
                    }
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="sm:self-end pb-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Saved Policy:
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-blue-600 text-white shadow-2xs">
                    <MapPin className="w-3 h-3" />
                    {getResolvedLocation()}
                  </span>
                </div>
              </div>

              {/* Must-Have Core Skills (Strict Requirement Matching - Up to 5 Core Skills) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                        Must-Have Core Skills (Strict Requirement Matching) *
                      </label>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        Must-Have Skills
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You can add <strong>up to 5 core skills</strong> essential for this position.
                    </p>
                  </div>

                  {/* Up to 5-Slot Builder Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowFiveSlotsBuilder(!showFiveSlotsBuilder)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{showFiveSlotsBuilder ? 'Hide Slot Grid' : '⚡ Up to 5-Slot Grid'}</span>
                  </button>
                </div>

                {/* Status Indicator Banner */}
                {coreCount === 0 ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Add up to 5 core skills required for this position.
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                      0 / 5 Added
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{coreCount} of 5 Core Skills Active:</strong> Essential requirements specified for candidate matching.
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ✓ {coreCount} of 5 Added
                    </span>
                  </div>
                )}

                {/* 5-Slot Dedicated Batch Builder (Opens on click for rapid 5 core skills entry) */}
                {showFiveSlotsBuilder && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                          Quick 5 Core Skill Slots Builder
                        </h4>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        Fill each slot and click "Save 5 Core Skills"
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Core Skill 1 (e.g. Primary Tech)
                        </label>
                        <input
                          type="text"
                          value={slot1}
                          onChange={(e) => setSlot1(e.target.value)}
                          placeholder="e.g. React"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Core Skill 2 (e.g. Language)
                        </label>
                        <input
                          type="text"
                          value={slot2}
                          onChange={(e) => setSlot2(e.target.value)}
                          placeholder="e.g. TypeScript"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Core Skill 3 (e.g. Backend/Platform)
                        </label>
                        <input
                          type="text"
                          value={slot3}
                          onChange={(e) => setSlot3(e.target.value)}
                          placeholder="e.g. Node.js"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Core Skill 4 (e.g. Database)
                        </label>
                        <input
                          type="text"
                          value={slot4}
                          onChange={(e) => setSlot4(e.target.value)}
                          placeholder="e.g. PostgreSQL"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Core Skill 5 (e.g. Architecture)
                        </label>
                        <input
                          type="text"
                          value={slot5}
                          onChange={(e) => setSlot5(e.target.value)}
                          placeholder="e.g. System Design"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFiveSlotsBuilder(false)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFiveSlots}
                        className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                      >
                        ✓ Add All 5 Slots to Core Skills
                      </button>
                    </div>
                  </div>
                )}

                {/* Single Core Skill Adder Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCoreSkill}
                    onChange={(e) => setNewCoreSkill(e.target.value)}
                    onKeyDown={(e) => {
                      handleKeyDownSelectAll(e);
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCoreSkill();
                      }
                    }}
                    placeholder="Type core skill (or paste comma-separated: React, TypeScript, Node.js, SQL, Docker) and press Enter"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text"
                  />
                  <button
                    type="button"
                    onClick={handleAddCoreSkill}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all cursor-pointer shadow-xs hover:shadow flex items-center gap-1.5 shrink-0 border border-emerald-500"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Core Skill</span>
                  </button>
                </div>

                {/* Numbered Core Skills List */}
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  {coreSkills.length === 0 && (
                    <span className="text-xs text-slate-400">
                      No core skills added yet. Add between 1 and 5 core skills.
                    </span>
                  )}
                  {coreSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-emerald-950 border border-emerald-300 shadow-2xs"
                    >
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        #{index + 1}
                      </span>
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoreSkill(index)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                        title="Remove core skill"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred / Nice-to-Have Skills (Unlimited Additions) */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800">
                      Preferred / Nice-to-Have Skills
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                      Unlimited Additions (Secondary Match Scoring)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {preferredSkills.length} Added (No limit)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Add unlimited bonus, tooling, or nice-to-have skills. These provide extra match points without eliminating candidates.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrefSkill}
                    onChange={(e) => setNewPrefSkill(e.target.value)}
                    onKeyDown={(e) => {
                      handleKeyDownSelectAll(e);
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrefSkill();
                      }
                    }}
                    placeholder="Add unlimited nice-to-have skill (e.g. Docker, GraphQL, Kubernetes, Kafka) and press Enter"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrefSkill}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer shadow-xs hover:shadow flex items-center gap-1.5 shrink-0 border border-blue-500"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Preferred Skill</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  {preferredSkills.length === 0 && (
                    <span className="text-xs text-slate-400">
                      No preferred skills added. (Unlimited option available)
                    </span>
                  )}
                  {preferredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrefSkill(index)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Remove preferred skill"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Education & Certification Benchmark
                  </label>
                  {education && (
                    <button
                      type="button"
                      onClick={() => setEducation('')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  onKeyDown={handleKeyDownSelectAll}
                  placeholder="e.g. Bachelor's in CS or equivalent experience"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text"
                />
              </div>

              {/* Short Summary with Clear & Select All Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Role Summary / Description
                  </label>
                  <div className="flex items-center gap-2">
                    {shortSummary && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (summaryTextareaRef.current) {
                              summaryTextareaRef.current.focus();
                              summaryTextareaRef.current.select();
                            }
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-1.5 py-0.2 rounded hover:bg-blue-50"
                          title="Select All (Ctrl+A)"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setShortSummary('')}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-1.5 py-0.2 rounded hover:bg-rose-50"
                        >
                          ✕ Clear Description
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  ref={summaryTextareaRef}
                  value={shortSummary}
                  onChange={(e) => setShortSummary(e.target.value)}
                  onKeyDown={handleKeyDownSelectAll}
                  rows={3}
                  placeholder="Brief synopsis of what this role entails..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 select-text"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('ai_extract')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-extract with AI</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{vacancyToEdit ? 'Save Changes' : 'Activate Vacancy'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add Department Pop-up Modal */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Add New Department</h3>
                  <p className="text-[11px] text-slate-500">Department will stay in dropdown for all vacancies</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddDeptModalOpen(false);
                  setDeptError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Department Name *
              </label>
              <input
                type="text"
                autoFocus
                value={newDeptInput}
                onChange={(e) => {
                  setNewDeptInput(e.target.value);
                  if (deptError) setDeptError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveDepartment();
                  }
                }}
                placeholder="e.g. Mobile Engineering, DevOps, HR & Talent..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
              {deptError && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {deptError}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                No preloaded departments. Once saved, this department will be automatically selected and retained in the dropdown for subsequent vacancy postings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddDeptModalOpen(false);
                  setDeptError(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDepartment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Department</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
