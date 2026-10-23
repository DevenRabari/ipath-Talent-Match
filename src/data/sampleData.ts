import { JobDescription, CandidateResult } from '../types';

export const INITIAL_VACANCIES: JobDescription[] = [
  {
    id: 'vac-1',
    title: 'Senior Full-Stack Engineer (React & Node.js)',
    department: 'Engineering & Product',
    employmentType: 'Full-time',
    location: 'Remote (US/EU/APAC)',
    minExperienceYears: 5,
    coreRequiredSkills: [
      'React',
      'TypeScript',
      'Node.js',
      'REST/GraphQL APIs',
      'PostgreSQL',
      'Cloud Architecture (AWS/GCP)',
    ],
    preferredSkills: [
      'Docker / Kubernetes',
      'Next.js',
      'CI/CD Pipelines',
      'System Design',
      'Agile / Scrum Leadership',
    ],
    educationRequirement: "Bachelor's Degree in Computer Science, Software Engineering, or equivalent experience",
    responsibilities: [
      'Architect and build highly scalable web applications serving enterprise clients.',
      'Lead full-stack feature development across React frontend and Node.js microservices.',
      'Write clean, test-driven, maintainable code with automated test coverage.',
      'Mentor mid-level and junior software engineers through architectural reviews.',
    ],
    shortSummary:
      'We are looking for a Senior Full-Stack Engineer with 5+ years of production experience building high-throughput modern web applications using React, TypeScript, and Node.js.',
    createdAt: '2026-10-10T10:00:00Z',
    status: 'active',
  },
  {
    id: 'vac-2',
    title: 'Talent Acquisition & People Operations Lead',
    department: 'Human Resources',
    employmentType: 'Full-time',
    location: 'Hybrid / Remote',
    minExperienceYears: 4,
    coreRequiredSkills: [
      'Full-Lifecycle Tech Recruitment',
      'ATS & Sourcing Platforms (LinkedIn Recruiter, Greenhouse)',
      'Candidate Screening & Interviewing',
      'HR Compliance & Employment Law',
      'Employer Branding',
    ],
    preferredSkills: [
      'People Analytics & Reporting',
      'Compensation Benchmarking',
      'Global Remote Hiring',
      'DEI Strategy',
    ],
    educationRequirement: "Bachelor's Degree in Human Resources, Business Administration, or related discipline",
    responsibilities: [
      'Own end-to-end recruitment lifecycle for engineering, product, and business roles.',
      'Partner closely with hiring managers to define job scorecards and calibrate requirements.',
      'Design structured interview stages and reduce time-to-hire while maintaining high candidate NPS.',
    ],
    shortSummary:
      'Seeking a proactive Talent Acquisition & People Operations Lead to scale our high-growth teams, manage candidate screening pipelines, and implement best-in-class hiring workflows.',
    createdAt: '2026-10-12T14:30:00Z',
    status: 'active',
  },
];

// No fake candidates - completely clean slate for real uploads
export const BENCHMARK_CANDIDATES: Record<string, CandidateResult[]> = {};
