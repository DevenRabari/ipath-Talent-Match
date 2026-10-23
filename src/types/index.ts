export interface JobDescription {
  id: string;
  title: string;
  department: string;
  employmentType: string;
  location: string;
  minExperienceYears: number;
  coreRequiredSkills: string[];
  preferredSkills: string[];
  educationRequirement: string;
  responsibilities: string[];
  shortSummary: string;
  createdAt: string;
  status?: 'active' | 'archived';
  archivedAt?: string;
  archiveReason?: string;
}

export interface MatchedRequirement {
  requirement: string;
  status: 'matched' | 'partial' | 'missing';
  evidence: string;
}

export interface MissingRequirement {
  requirement: string;
  impact: 'Critical' | 'Moderate' | 'Minor';
  details: string;
}

export interface InterviewQuestion {
  question: string;
  probeObjective: string;
}

export type CandidateVerdict = 'Shortlist' | 'Review' | 'Reject';
export type ShortlistStatus = 'shortlisted' | 'interview' | 'review' | 'rejected' | 'pending';

export interface EmailDispatchRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  toEmail: string;
  type: 'shortlist' | 'rejection' | 'interview';
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'draft';
  messageId?: string;
}

export interface CandidateResult {
  id: string;
  candidateName: string;
  email?: string;
  phone?: string;
  location?: string;
  currentTitle: string;
  totalExperienceYears: number;
  educationSummary?: string;
  skillsFound: string[];
  matchScore: number; // 0 - 100
  skillsMatchScore: number;
  experienceMatchScore: number;
  educationRoleMatchScore: number;
  matchedRequirements: MatchedRequirement[];
  missingRequirements: MissingRequirement[];
  keyStrengths: string[];
  redFlagsOrConcerns: string[];
  executiveSummary: string;
  suggestedInterviewQuestions: InterviewQuestion[];
  verdict: CandidateVerdict;
  fileName: string;
  folderName?: string;
  processedAt: string;
  shortlistStatus: ShortlistStatus;
  hrNotes?: string;
  rank?: number;
  dedicatedVacancyId?: string;
  emailSentAt?: string;
  lastEmailType?: 'shortlist' | 'rejection' | 'interview';
  emailHistory?: EmailDispatchRecord[];
  resumeData?: string;
  resumeType?: 'pdf' | 'docx' | 'doc' | 'text';
  resumeFileName?: string;
}

export interface ResumeUploadItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize?: string;
  folderName?: string;
  type: 'pdf' | 'docx' | 'doc' | 'text';
  textData?: string;
  base64Data?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  result?: CandidateResult;
}
