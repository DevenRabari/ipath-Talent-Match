import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  UploadCloud,
  FolderUp,
  FileText,
  FilePlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  Folder,
  Briefcase,
  ChevronDown,
  PlusCircle,
  ShieldCheck,
  Activity,
  Target,
  Cpu,
} from 'lucide-react';
import { JobDescription, CandidateResult, ResumeUploadItem } from '../types';

export interface ResumeUploadSectionRef {
  triggerFolderUpload: () => void;
  triggerFileUpload: () => void;
}

interface ResumeUploadSectionProps {
  currentVacancy: JobDescription;
  vacancies?: JobDescription[];
  onSelectVacancy?: (vacancy: JobDescription) => void;
  onOpenNewVacancy?: () => void;
  onCandidatesAdded: (candidates: CandidateResult[]) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const ResumeUploadSection = forwardRef<ResumeUploadSectionRef, ResumeUploadSectionProps>(
  (
    {
      currentVacancy,
      vacancies = [],
      onSelectVacancy,
      onOpenNewVacancy,
      onCandidatesAdded,
      isProcessing,
      setIsProcessing,
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState<'folder_upload' | 'paste'>('folder_upload');
    const [queue, setQueue] = useState<ResumeUploadItem[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [autoFilterOnUpload, setAutoFilterOnUpload] = useState(true);
    const [minMatchThreshold, setMinMatchThreshold] = useState<number>(70);
    const [pastedText, setPastedText] = useState('');
    const [pastedName, setPastedName] = useState('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [progressStats, setProgressStats] = useState({ total: 0, completed: 0, shortlisted: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose imperative triggers so Vacancy cards can open the file/folder picker directly
    useImperativeHandle(ref, () => ({
      triggerFolderUpload: () => {
        folderInputRef.current?.click();
      },
      triggerFileUpload: () => {
        fileInputRef.current?.click();
      },
    }));

    // Guaranteed Ctrl+A selection
    const handleKeyDownSelectAll = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.stopPropagation();
        e.currentTarget.select();
      }
    };

    // Drag and Drop handlers
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    // Recursively traverse folder entries from drag and drop
    const traverseFileTree = async (item: any, path = ''): Promise<{ file: File; folderName?: string }[]> => {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file((file: File) => {
            const folderName = path ? path.split('/')[0] : undefined;
            resolve([{ file, folderName }]);
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          const folderName = item.name;
          dirReader.readEntries(async (entries: any[]) => {
            const promises = entries.map((entry) =>
              traverseFileTree(entry, path ? `${path}/${entry.name}` : entry.name)
            );
            const results = await Promise.all(promises);
            resolve(
              results.flat().map((res) => ({
                ...res,
                folderName: res.folderName || folderName,
              }))
            );
          });
        } else {
          resolve([]);
        }
      });
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const filePromises: Promise<{ file: File; folderName?: string }[]>[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) {
            filePromises.push(traverseFileTree(entry));
          } else {
            const f = items[i].getAsFile();
            if (f) filePromises.push(Promise.resolve([{ file: f }]));
          }
        }

        const nestedFiles = await Promise.all(filePromises);
        const flattened = nestedFiles.flat();
        if (flattened.length > 0) {
          handleRawFiles(flattened);
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    // File & Folder input change
    const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        const folderName =
          files[0]?.webkitRelativePath?.split('/')[0] || 'Selected_Applicant_Folder';
        const items = files.map((f) => ({ file: f, folderName }));
        handleRawFiles(items);
        e.target.value = '';
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    };

    const handleFiles = (files: File[]) => {
      handleRawFiles(files.map((file) => ({ file })));
    };

    const handleRawFiles = (items: { file: File; folderName?: string }[]) => {
      const validItems = items.filter(({ file }) => {
        const ext = file.name.toLowerCase();
        return (
          ext.endsWith('.pdf') ||
          ext.endsWith('.txt') ||
          ext.endsWith('.doc') ||
          ext.endsWith('.docx') ||
          file.type === 'application/pdf' ||
          file.type === 'text/plain'
        );
      });

      if (validItems.length === 0) {
        setStatusMessage('No valid resume files (PDF, TXT, DOCX) found in selection.');
        return;
      }

      const newItems: ResumeUploadItem[] = validItems.map(({ file, folderName }) => {
        const lower = file.name.toLowerCase();
        let fileType: 'pdf' | 'docx' | 'doc' | 'text' = 'text';
        if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
          fileType = 'pdf';
        } else if (lower.endsWith('.docx') || file.type.includes('wordprocessingml')) {
          fileType = 'docx';
        } else if (lower.endsWith('.doc') || file.type.includes('msword')) {
          fileType = 'doc';
        }

        return {
          id: `up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          fileName: file.name,
          folderName,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          type: fileType,
          status: 'pending',
        };
      });

      setQueue((prev) => [...prev, ...newItems]);
      setStatusMessage(
        `Ingested ${newItems.length} resume(s) for "${currentVacancy.title}". Screening exclusively for this job profile.`
      );

      // Trigger automatic batch evaluation
      if (autoFilterOnUpload) {
        setTimeout(() => {
          executeBatchEvaluation(newItems);
        }, 300);
      }
    };

    const removeItem = (id: string) => {
      setQueue((prev) => prev.filter((item) => item.id !== id));
    };

    // Convert File to Base64 or Text
    const readFileData = (
      file: File
    ): Promise<{ type: 'pdf' | 'docx' | 'doc' | 'text'; data: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const lowerName = file.name.toLowerCase();
        const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
        const isDocx = lowerName.endsWith('.docx') || file.type.includes('wordprocessingml');
        const isDoc = lowerName.endsWith('.doc') || file.type.includes('msword');

        if (isPdf) {
          reader.onload = () => {
            resolve({ type: 'pdf', data: reader.result as string });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else if (isDocx) {
          reader.onload = () => {
            resolve({ type: 'docx', data: reader.result as string });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else if (isDoc) {
          reader.onload = () => {
            resolve({ type: 'doc', data: reader.result as string });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else {
          reader.onload = () => {
            resolve({ type: 'text', data: reader.result as string });
          };
          reader.onerror = reject;
          reader.readAsText(file);
        }
      });
    };

    // Evaluate candidate against the currently dedicated vacancy
    const evaluateCandidate = async (
      type: 'pdf' | 'docx' | 'doc' | 'text',
      data: string,
      fileName: string,
      folderName?: string
    ): Promise<CandidateResult> => {
      const isBinary = type === 'pdf' || type === 'docx' || type === 'doc';
      const payload = {
        jobDescription: currentVacancy,
        candidateId: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        resumeContent: {
          type,
          fileName,
          ...(isBinary ? { base64Data: data } : { textData: data }),
        },
      };

      const response = await fetch('/api/parse-match-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze resume');
      }

      const result = await response.json();
      return {
        ...result,
        folderName,
        dedicatedVacancyId: currentVacancy.id,
        resumeData: data,
        resumeType: type,
        resumeFileName: fileName,
        shortlistStatus:
          result.matchScore >= 80 ? 'shortlisted' : result.matchScore >= 60 ? 'review' : 'rejected',
      };
    };

    // Execute batch evaluation with concurrency
    const executeBatchEvaluation = async (itemsToProcess?: ResumeUploadItem[]) => {
      const targetItems = itemsToProcess || queue.filter((item) => item.status === 'pending');
      if (targetItems.length === 0) return;

      setIsProcessing(true);
      setProgressStats({ total: targetItems.length, completed: 0, shortlisted: 0 });
      setStatusMessage(
        `Dedicated Pipeline: Screening ${targetItems.length} resume(s) specifically against "${currentVacancy.title}"...`
      );

      const processedCandidates: CandidateResult[] = [];
      const updatedQueue = [...queue];

      const batchSize = 2;
      for (let i = 0; i < targetItems.length; i += batchSize) {
        const slice = targetItems.slice(i, i + batchSize);

        const promises = slice.map(async (item) => {
          if (!item.file) return null;

          const qIdx = updatedQueue.findIndex((q) => q.id === item.id);
          if (qIdx !== -1) {
            updatedQueue[qIdx] = { ...updatedQueue[qIdx], status: 'processing' };
            setQueue([...updatedQueue]);
          }

          try {
            const fileData = await readFileData(item.file);
            const result = await evaluateCandidate(
              fileData.type,
              fileData.data,
              item.fileName,
              item.folderName
            );

            if (qIdx !== -1) {
              updatedQueue[qIdx] = { ...updatedQueue[qIdx], status: 'completed', result };
              setQueue([...updatedQueue]);
            }

            return result;
          } catch (err: any) {
            console.error('Batch item evaluation error:', err);
            if (qIdx !== -1) {
              updatedQueue[qIdx] = {
                ...updatedQueue[qIdx],
                status: 'error',
                errorMessage: err.message || 'Analysis error',
              };
              setQueue([...updatedQueue]);
            }
            return null;
          }
        });

        const batchResults = await Promise.all(promises);
        const validResults = batchResults.filter(Boolean) as CandidateResult[];
        processedCandidates.push(...validResults);

        const shortlistedSoFar = processedCandidates.filter((c) => c.matchScore >= minMatchThreshold).length;
        setProgressStats({
          total: targetItems.length,
          completed: Math.min(targetItems.length, i + batchSize),
          shortlisted: shortlistedSoFar,
        });
      }

      setIsProcessing(false);
      if (processedCandidates.length > 0) {
        onCandidatesAdded(processedCandidates);
        const topCount = processedCandidates.filter((c) => c.matchScore >= 80).length;
        setStatusMessage(
          `Screening Complete: Processed ${processedCandidates.length} candidate(s) for "${currentVacancy.title}". ${topCount} shortlisted!`
        );

        setTimeout(() => {
          setQueue((prev) => prev.filter((item) => item.status !== 'completed'));
        }, 3500);
      }
    };

    // Handle pasted text submission
    const handlePastedSubmit = async () => {
      if (!pastedText.trim()) return;

      setIsProcessing(true);
      setStatusMessage(`Screening candidate text against ${currentVacancy.title}...`);

      try {
        const fileName = pastedName.trim()
          ? `${pastedName.replace(/\s+/g, '_')}_CV.txt`
          : 'Pasted_Candidate_CV.txt';

        const result = await evaluateCandidate('text', pastedText, fileName, 'Direct_Text_Intake');
        onCandidatesAdded([result]);
        setPastedText('');
        setPastedName('');
        setStatusMessage(
          `Candidate ${result.candidateName} evaluated: ${result.matchScore}% Match for "${currentVacancy.title}"!`
        );
      } catch (err: any) {
        console.error(err);
        setStatusMessage(`Error: ${err.message || 'Evaluation failed'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    const activeVacancies = vacancies.filter((v) => v.status !== 'archived');

    // Safety check: if currentVacancy is archived, automatically switch to the first active vacancy
    React.useEffect(() => {
      if (currentVacancy.status === 'archived' && activeVacancies.length > 0 && onSelectVacancy) {
        onSelectVacancy(activeVacancies[0]);
      }
    }, [currentVacancy.status, activeVacancies, onSelectVacancy]);

    return (
      <div id="upload-screening-section" className="rounded-2xl border-2 border-blue-200/90 bg-white/95 backdrop-blur-xs p-5 sm:p-6 shadow-sm space-y-4 scroll-mt-20">
        {/* HIGH-VISIBILITY TARGET VACANCY HIGHLIGHT PANEL */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-100/90 via-sky-50/80 to-blue-50/90 border-2 border-blue-300/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-extrabold tracking-wider uppercase shadow-2xs">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Which Vacancy Are These Files Getting Uploaded For?</span>
              </div>
              <p className="text-xs font-medium text-slate-700">
                Uploaded resumes will be scored exclusively against the criteria of the selected active job vacancy below.
              </p>
            </div>

            {onOpenNewVacancy && (
              <button
                type="button"
                onClick={onOpenNewVacancy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-white hover:bg-blue-100/60 border border-blue-300 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create New Vacancy</span>
              </button>
            )}
          </div>

          {/* Vacancy Dropdown Switcher - Big, Clean, Filtered exclusively to Active Vacancies */}
          <div className="relative w-full">
            <select
              value={currentVacancy.id}
              onChange={(e) => {
                const selected = activeVacancies.find((v) => v.id === e.target.value);
                if (selected && onSelectVacancy) onSelectVacancy(selected);
              }}
              className="w-full appearance-none rounded-xl border-2 border-blue-300 hover:border-blue-500 bg-white px-4 py-3.5 pr-12 text-sm sm:text-base font-extrabold text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
            >
              {activeVacancies.length === 0 ? (
                <option value="">No Active Vacancies (All Archived in Backend)</option>
              ) : (
                activeVacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    🎯 {v.title} ({v.department} • {v.minExperienceYears}+ yrs exp required)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 pointer-events-none" />
          </div>

          {/* Quick Criteria Preview Tags */}
          <div className="pt-2 border-t border-blue-200/70 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800">Scoring Benchmark:</span>
            <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-semibold border border-blue-200">
              {currentVacancy.minExperienceYears}+ Years Experience
            </span>
            <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-semibold border border-blue-200">
              {currentVacancy.coreRequiredSkills.length} Core Skills ({currentVacancy.coreRequiredSkills.slice(0, 3).join(', ')})
            </span>
            <span className="px-2 py-0.5 rounded bg-white text-slate-800 font-semibold border border-blue-200">
              {currentVacancy.department} • {currentVacancy.location}
            </span>
          </div>
        </div>

        {/* Upload Modes & Auto-Filter Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-blue-50/70 p-3 rounded-xl border border-blue-200/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('folder_upload')}
              className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'folder_upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-900 hover:text-blue-950 hover:bg-blue-100/70'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Folder / Bulk File Intake</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-900 hover:text-blue-950 hover:bg-blue-100/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Resume Text</span>
            </button>
          </div>

          {/* Auto-Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoFilterOnUpload}
                onChange={(e) => setAutoFilterOnUpload(e.target.checked)}
                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
              />
              <span className="font-semibold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Auto-filter & shortlist immediately on upload
              </span>
            </label>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-[11px] border-l border-blue-200 pl-3">
              <span>Shortlist Cutoff:</span>
              <span className="font-bold text-blue-900">≥ {minMatchThreshold}% Match</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Folder & File Dropzone with CLEAN SQUARE BOUNDARY */}
        {activeTab === 'folder_upload' ? (
          <div className="space-y-4">
            {/* Square Boundary Dropzone with Corner Brackets & Matching Theme Background */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-none border-2 border-blue-300 p-8 sm:p-10 text-center transition-all bg-gradient-to-b from-blue-50/40 via-white to-sky-50/30 ${
                dragActive
                  ? 'border-blue-600 bg-blue-100/70 shadow-md ring-2 ring-blue-500/30'
                  : 'hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              {/* Technical Precision Square Corner Brackets */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-600 z-10 pointer-events-none" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-600 z-10 pointer-events-none" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-600 z-10 pointer-events-none" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-600 z-10 pointer-events-none" />
              {/* Hidden native folder input */}
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: '', directory: '' } as any)}
                multiple
                onChange={handleFolderInput}
                className="hidden"
              />

              {/* Hidden multi-file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
              />

              {/* Foreground UI Components */}
              <div className="relative z-10 pointer-events-auto space-y-4 pt-4">
                {/* Square Icon Container */}
                <div className="w-14 h-14 mx-auto rounded-none border-2 border-blue-600 bg-white text-blue-700 flex items-center justify-center shadow-xs">
                  <FolderUp className="w-7 h-7 text-blue-600" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Drag & Drop Candidate Resume Folder or Files for "{currentVacancy.title}"
                  </h3>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Choose an applicant folder or select individual resume files. Resumes will be matched strictly against{' '}
                    <strong className="text-blue-700 font-extrabold">{currentVacancy.title}</strong> using the Gemini AI screening engine.
                  </p>
                </div>

                {/* Professional Square Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-none border-2 border-blue-600 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Folder className="w-4 h-4" />
                    <span>Upload Resume Folder for "{currentVacancy.title.slice(0, 22)}..."</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-400 shadow-2xs transition-all cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4 text-slate-600" />
                    <span>Select Resume Files (PDF / TXT / DOCX)</span>
                  </button>
                </div>

                {/* Bottom Technical Telemetry Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[10px] text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-white border border-slate-200">
                    <Cpu className="w-3 h-3 text-blue-600" />
                    Gemini 2.5 Flash Engine
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-white border border-slate-200">
                    <Target className="w-3 h-3 text-emerald-600" />
                    {currentVacancy.coreRequiredSkills.length} Core Requirements Verified
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-white border border-slate-200">
                    <Folder className="w-3 h-3 text-amber-600" />
                    Batch Recursive Folder Ingestion
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-white border border-slate-200">
                    <Activity className="w-3 h-3 text-indigo-600" />
                    Automated Candidate Ranking
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time processing progress bar */}
            {isProcessing && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Screening & Scoring Resumes for "{currentVacancy.title}"...
                  </span>
                  <span className="font-extrabold text-blue-900">
                    {progressStats.completed} of {progressStats.total} Screened
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        progressStats.total > 0
                          ? (progressStats.completed / progressStats.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Auto-shortlisted: <strong>{progressStats.shortlisted} candidates</strong></span>
                  <span>Auditing required skills & experience seniority</span>
                </div>
              </div>
            )}

            {/* Queued files display */}
            {queue.length > 0 && !isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-bold text-slate-700">
                    Folder Intake Queue ({queue.length} Resumes Ready for "{currentVacancy.title}")
                  </span>
                  <button
                    onClick={() => setQueue([])}
                    className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                  >
                    Clear Queue
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-slate-800 font-bold truncate max-w-[220px] sm:max-w-xs">
                            {item.fileName}
                          </div>
                          {item.folderName && (
                            <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                              <Folder className="w-2.5 h-2.5" />
                              <span>{item.folderName}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          ({item.fileSize})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded bg-slate-200">
                            Ready to Screen
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-[11px] font-semibold text-blue-700 px-2 py-0.5 rounded bg-blue-100 border border-blue-200 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Screening...
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-[11px] font-bold text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {item.result?.matchScore}% Match
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[11px] font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-100 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={item.status === 'processing'}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual trigger button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => executeBatchEvaluation()}
                    disabled={isProcessing || queue.filter((q) => q.status === 'pending').length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Screen & Filter {queue.filter((q) => q.status === 'pending').length} Resumes for "{currentVacancy.title}"
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Candidate Name / Identifier (Optional)"
                value={pastedName}
                onChange={(e) => setPastedName(e.target.value)}
                onKeyDown={handleKeyDownSelectAll}
                className="max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              {pastedText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pasteTextareaRef.current) {
                        pasteTextareaRef.current.focus();
                        pasteTextareaRef.current.select();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText('');
                      setPastedName('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </div>

            <textarea
              ref={pasteTextareaRef}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              onKeyDown={handleKeyDownSelectAll}
              placeholder="Paste raw CV or resume text content here..."
              rows={8}
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePastedSubmit}
                disabled={isProcessing || !pastedText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating for {currentVacancy.title}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Evaluate for {currentVacancy.title}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Status Message Notification */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }
);
