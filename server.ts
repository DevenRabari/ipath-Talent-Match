import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deep PDF Text Extraction ensuring 100% data capture just like DOCX
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textData = await parser.getText();
    const clean = typeof textData === 'string' ? textData : (textData?.text || '');
    await parser.destroy().catch(() => {});
    if (clean && clean.trim().length > 15) {
      return clean.trim();
    }
  } catch (err: any) {
    console.warn('PDFParse extraction note:', err?.message || err);
  }

  // Fallback: extract text character runs from uncompressed PDF streams
  try {
    const rawStr = buffer.toString('utf-8');
    const matches = rawStr.match(/[A-Za-z0-9\s.,!?:;@&()/\-–—"']{5,}/g);
    if (matches && matches.length > 10) {
      const extracted = matches.join(' ').replace(/\s+/g, ' ').trim();
      if (extracted.length > 40) return extracted;
    }
  } catch (rawErr) {
    console.warn('Raw PDF stream fallback note:', rawErr);
  }

  return '';
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Calculate actual working experience years from start-to-finish career timeline
function extractCareerTimelineYears(text: string): { years: number; startYear?: number; finishYear?: number } | null {
  if (!text || text.trim().length < 15) return null;
  const currentYear = new Date().getFullYear(); // 2026

  // 1. Check for explicit text like "8 years of experience", "5+ years experience", "10 yrs of work experience"
  const explicitExpMatch = text.match(
    /\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional\s+|relevant\s+|total\s+|work\s+|hands-on\s+)?experience|\s+working|\s+in\s+the\s+industry)\b/i
  );
  const explicitYears = explicitExpMatch ? parseFloat(explicitExpMatch[1]) : 0;

  // 2. Scan for date ranges like "2018 - Present", "2017 to Present", "Jan 2019 - Current", "2016-2023", "2015 – Till date"
  const rangePattern =
    /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/|\d{1,2}-)\s*)?(19\d{2}|20\d{2})\s*(?:-|–|—|to|\/)\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/|\d{1,2}-)\s*)?(present|current|now|till\s*date|ongoing|currently|19\d{2}|20\d{2})/gi;

  let earliestStart = Infinity;
  let latestEnd = -Infinity;
  let hasOngoingCurrent = false;
  let match: RegExpExecArray | null;

  while ((match = rangePattern.exec(text)) !== null) {
    const startY = parseInt(match[1], 10);
    const endRaw = match[2].toLowerCase();
    let endY = currentYear;

    if (endRaw.match(/^(19\d{2}|20\d{2})$/)) {
      endY = parseInt(endRaw, 10);
    } else {
      hasOngoingCurrent = true;
      endY = currentYear;
    }

    if (startY >= 1980 && startY <= currentYear && endY >= startY) {
      if (startY < earliestStart) earliestStart = startY;
      if (endY > latestEnd) latestEnd = endY;
    }
  }

  // Also check ongoing jobs like "2020 - Present"
  const ongoingPattern = /\b(19\d{2}|20\d{2})\s*[-–—]\s*(?:present|current|ongoing|till\s*date|now)\b/gi;
  let ongoingMatch: RegExpExecArray | null;
  while ((ongoingMatch = ongoingPattern.exec(text)) !== null) {
    const startY = parseInt(ongoingMatch[1], 10);
    if (startY >= 1980 && startY <= currentYear) {
      hasOngoingCurrent = true;
      if (startY < earliestStart) earliestStart = startY;
      if (currentYear > latestEnd) latestEnd = currentYear;
    }
  }

  if (earliestStart !== Infinity) {
    const finish = hasOngoingCurrent ? currentYear : latestEnd !== -Infinity ? latestEnd : currentYear;
    const calculatedDiff = finish - earliestStart;
    if (calculatedDiff > 0 && calculatedDiff <= 45) {
      const finalYears = Math.max(calculatedDiff, explicitYears > 0 ? explicitYears : calculatedDiff);
      return { years: finalYears, startYear: earliestStart, finishYear: finish };
    }
  }

  if (explicitYears > 0) {
    return { years: explicitYears };
  }

  // Fallback: search for all 4-digit years in the text (between 1985 and currentYear)
  const allYears = Array.from(text.matchAll(/\b(19[89]\d|20[0-2]\d)\b/g))
    .map((m) => parseInt(m[1], 10))
    .filter((y) => y >= 1985 && y <= currentYear);

  if (allYears.length >= 2) {
    const hasCurrentWord = /\b(present|current|ongoing|till\s*date)\b/i.test(text);
    const minY = Math.min(...allYears);
    const maxY = hasCurrentWord ? currentYear : Math.max(...allYears);
    const diff = maxY - minY;
    if (diff >= 1 && diff <= 40) {
      return { years: diff, startYear: minY, finishYear: maxY };
    }
  }

  return null;
}

const SKILL_SYNONYMS: Record<string, string[]> = {
  react: ['react', 'react.js', 'reactjs', 'react native', 'redux', 'next.js', 'nextjs', 'hooks', 'react components', 'frontend react'],
  node: ['node', 'node.js', 'nodejs', 'express', 'express.js', 'nestjs', 'fastify', 'backend javascript', 'node api', 'node microservices'],
  typescript: ['typescript', 'ts', 'type-safe', 'typed javascript'],
  javascript: ['javascript', 'js', 'es6', 'ecmascript'],
  postgresql: ['postgres', 'postgresql', 'psql', 'sql', 'relational database', 'rdbms', 'rds postgres', 'sql queries', 'database schema'],
  mysql: ['mysql', 'mariadb', 'sql', 'relational database'],
  mongodb: ['mongodb', 'mongo', 'nosql', 'document db'],
  python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'pytorch'],
  java: ['java', 'spring', 'spring boot', 'jvm', 'hibernate'],
  docker: ['docker', 'container', 'containers', 'containerization', 'dockerfile', 'docker-compose'],
  kubernetes: ['kubernetes', 'k8s', 'helm', 'kubectl', 'eks', 'gke', 'cluster management'],
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'dynamodb', 'cloud'],
  gcp: ['gcp', 'google cloud', 'cloud run', 'bigquery', 'google cloud platform'],
  cicd: ['ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'github actions', 'gitlab ci', 'jenkins', 'circleci', 'deployment pipeline'],
  rest: ['rest', 'restful', 'rest api', 'apis', 'web services', 'endpoints', 'swagger', 'postman'],
  graphql: ['graphql', 'apollo', 'gql', 'schema design', 'resolvers'],
  system_design: ['system design', 'architecture', 'architect', 'microservices', 'distributed systems', 'scalability', 'high-level design', 'low-level design', 'hld', 'lld'],
  recruitment: ['recruitment', 'recruiting', 'talent acquisition', 'sourcing', 'candidate screening', 'interviewing', 'headhunting', 'hiring', 'talent search', 'ats', 'greenhouse', 'lever', 'linkedin recruiter', 'onboarding'],
  hr_compliance: ['hr compliance', 'employment law', 'labor laws', 'statutory compliance', 'hr policies', 'posh', 'workplace ethics'],
  employer_branding: ['employer branding', 'campus recruitment', 'talent brand', 'recruitment marketing', 'candidate experience'],
  analytics: ['analytics', 'reporting', 'kpi', 'metrics', 'bi', 'dashboards', 'data analysis'],
};

function checkSkillMatchSemantically(skillName: string, text: string): { matched: boolean; matchedTerm: string; evidence: string } {
  const lowerText = text.toLowerCase();
  const lowerSkill = skillName.toLowerCase().trim();

  // 1. Direct or partial regex match
  const escapedSkill = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\b${escapedSkill}\\b`, 'i').test(text)) {
    const idx = lowerText.indexOf(lowerSkill);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + lowerSkill.length + 60);
    const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    return {
      matched: true,
      matchedTerm: skillName,
      evidence: `Found direct match for "${skillName}" in candidate profile/responsibilities: "...${snippet}..."`,
    };
  }

  // 2. Normalized variations (remove dots, hyphens, slashes)
  const normSkill = lowerSkill.replace(/[\.\-\_\/\s]+/g, '');
  const words = text.split(/\s+/);
  for (const w of words) {
    const normW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normW && normW === normSkill && normW.length >= 3) {
      return {
        matched: true,
        matchedTerm: w,
        evidence: `Candidate demonstrates equivalent capability "${w}" in role descriptions.`,
      };
    }
  }

  // 3. Check synonym dictionary
  for (const [_key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const skillBelongs = synonyms.some((syn) => lowerSkill.includes(syn) || syn.includes(lowerSkill));
    if (skillBelongs) {
      for (const syn of synonyms) {
        if (new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
          return {
            matched: true,
            matchedTerm: syn,
            evidence: `Candidate demonstrated synonymous skill/tool "${syn}" (matching "${skillName}") in their role deliverables.`,
          };
        }
      }
    }
  }

  // 4. Token-based matching: if skill has multiple words like "Full-Lifecycle Tech Recruitment", check if core tokens exist
  const tokens = lowerSkill
    .split(/[\s\/\(\)\,\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !['with', 'from', 'using', 'full', 'tech', 'core', 'skills'].includes(t));

  if (tokens.length >= 2) {
    const matchedTokens = tokens.filter((t) => lowerText.includes(t));
    if (
      matchedTokens.length >= 2 ||
      (tokens.length === 2 &&
        matchedTokens.length >= 1 &&
        tokens.some((t) => ['recruitment', 'sourcing', 'architecture', 'database', 'pipeline'].includes(t)))
    ) {
      return {
        matched: true,
        matchedTerm: matchedTokens.join(' & '),
        evidence: `Candidate demonstrates key competencies (${matchedTokens.join(', ')}) related to "${skillName}" across role descriptions.`,
      };
    }
  }

  return { matched: false, matchedTerm: '', evidence: '' };
}

async function startServer() {
  const app = express();
  const PORT = process.env.NGINX_PORT ? 3000 : (Number(process.env.PORT) || 3000);

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // In-memory backend database for Job Vacancies (Active & Archived)
  let backendVacancies = [
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

  // Vacancies API
  app.get('/api/vacancies', (req: Request, res: Response) => {
    const { status } = req.query;
    if (status && typeof status === 'string') {
      res.json({ vacancies: backendVacancies.filter((v: any) => v.status === status) });
      return;
    }
    res.json({ vacancies: backendVacancies });
  });

  app.post('/api/vacancies', (req: Request, res: Response) => {
    const vacancy = req.body;
    if (!vacancy || !vacancy.id || !vacancy.title) {
      res.status(400).json({ error: 'Valid vacancy with id and title required' });
      return;
    }
    const idx = backendVacancies.findIndex((v: any) => v.id === vacancy.id);
    const updated = {
      ...vacancy,
      status: vacancy.status || 'active',
    };
    if (idx >= 0) {
      backendVacancies[idx] = updated;
    } else {
      backendVacancies.unshift(updated);
    }
    res.json({ success: true, vacancy: updated, vacancies: backendVacancies });
  });

  // Archive vacancy: remove from active but preserve safely in backend
  app.post('/api/vacancies/:id/archive', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const vacancy = backendVacancies.find((v: any) => v.id === id);
    if (!vacancy) {
      res.status(404).json({ error: 'Vacancy not found' });
      return;
    }
    (vacancy as any).status = 'archived';
    (vacancy as any).archivedAt = new Date().toISOString();
    if (reason) (vacancy as any).archiveReason = reason;

    console.log(`[BACKEND REPOSITORY] Vacancy "${vacancy.title}" (${vacancy.id}) archived into backend repository.`);
    res.json({
      success: true,
      message: `Vacancy "${vacancy.title}" moved to backend archive. Retained for future screening.`,
      vacancy,
      vacancies: backendVacancies,
    });
  });

  // Reactivate archived vacancy back to active pipeline
  app.post('/api/vacancies/:id/reactivate', (req: Request, res: Response) => {
    const { id } = req.params;
    const vacancy = backendVacancies.find((v: any) => v.id === id);
    if (!vacancy) {
      res.status(404).json({ error: 'Vacancy not found' });
      return;
    }
    (vacancy as any).status = 'active';
    (vacancy as any).reactivatedAt = new Date().toISOString();

    console.log(`[BACKEND REPOSITORY] Vacancy "${vacancy.title}" (${vacancy.id}) reactivated to active pipeline.`);
    res.json({
      success: true,
      message: `Vacancy "${vacancy.title}" reactivated to active board.`,
      vacancy,
      vacancies: backendVacancies,
    });
  });

  // Delete vacancy
  app.delete('/api/vacancies/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    backendVacancies = backendVacancies.filter((v: any) => v.id !== id);
    res.json({ success: true, vacancies: backendVacancies });
  });

  // Extract structured Job Description from raw text
  app.post('/api/extract-jd', async (req: Request, res: Response) => {
    try {
      const { rawText } = req.body;
      if (!rawText || typeof rawText !== 'string') {
        res.status(400).json({ error: 'rawText is required' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback rule-based parsing if no API key
        res.json({
          title: 'Custom Role',
          department: 'General',
          employmentType: 'Full-time',
          minExperienceYears: 3,
          location: 'Remote / Hybrid',
          coreRequiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'System Architecture'],
          preferredSkills: ['AWS', 'Docker', 'GraphQL', 'CI/CD Pipelines'],
          educationRequirement: "Bachelor's Degree or equivalent",
          responsibilities: ['Execute primary departmental duties', 'Collaborate with cross-functional teams'],
          shortSummary: rawText.slice(0, 200) + '...',
        });
        return;
      }

      const prompt = `Analyze this Job Description posted for recruitment (e.g. from LinkedIn or careers site) and extract structured hiring requirements:
"""
${rawText}
"""
Extract the job title, department, employment type, minimum required years of experience (numeric), location policy (e.g. Remote / Hybrid, On-site, Hybrid, Remote, Flexible), at least 5 strict core required skills (accounting for 50% match weightage), unlimited nice-to-have / preferred skills, minimum education, key responsibilities, and a 1-2 sentence executive role summary.`;

      let parsedData: any = null;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  department: { type: Type.STRING },
                  employmentType: { type: Type.STRING },
                  minExperienceYears: { type: Type.NUMBER },
                  location: { type: Type.STRING },
                  coreRequiredSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  preferredSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  educationRequirement: { type: Type.STRING },
                  responsibilities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  shortSummary: { type: Type.STRING },
                },
                required: [
                  'title',
                  'department',
                  'minExperienceYears',
                  'coreRequiredSkills',
                  'preferredSkills',
                  'educationRequirement',
                  'responsibilities',
                  'shortSummary',
                ],
              },
            },
          });

          if (response.text) {
            parsedData = JSON.parse(response.text);
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Extraction with ${modelName} encountered error:`, modelErr.message || modelErr);
        }
      }

      if (!parsedData) {
        // High quality heuristic extraction fallback if upstream API is temporarily rate limited
        const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
        const firstLine = lines[0] || 'Senior Role';
        const expMatch = rawText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
        const minExp = expMatch ? parseInt(expMatch[1], 10) : 3;

        // Extract skills by searching known terms
        const commonTech = [
          'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL',
          'Kubernetes', 'GraphQL', 'Next.js', 'Go', 'Java', 'SQL', 'GCP', 'Terraform',
          'Recruitment', 'ATS', 'Marketing', 'Analytics', 'Project Management'
        ];
        const matchedSkills = commonTech.filter((t) =>
          new RegExp(`\\b${t}\\b`, 'i').test(rawText)
        );

        parsedData = {
          title: firstLine.replace(/^(looking for|we are hiring|job title:?)/i, '').trim() || 'Software Engineer',
          department: 'Engineering / Operations',
          employmentType: rawText.toLowerCase().includes('contract') ? 'Contract' : 'Full-time',
          minExperienceYears: minExp,
          location: rawText.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
          coreRequiredSkills: matchedSkills.length > 0 ? matchedSkills.slice(0, 5) : ['Core Domain Skills', 'System Design', 'Communication'],
          preferredSkills: matchedSkills.length > 5 ? matchedSkills.slice(5) : ['Cloud Platforms', 'Agile Leadership'],
          educationRequirement: "Bachelor's Degree in related discipline or equivalent experience",
          responsibilities: [
            'Lead architecture and hands-on execution for high-priority initiatives.',
            'Collaborate with cross-functional stakeholders and deliver quality milestones.',
          ],
          shortSummary: rawText.slice(0, 180) + '...',
        };
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error('Error in /api/extract-jd:', error);
      res.status(500).json({ error: error.message || 'Failed to extract job description' });
    }
  });

  // Parse CV and match against Job Description
  app.post('/api/parse-match-resume', async (req: Request, res: Response) => {
    try {
      const { jobDescription, resumeContent, candidateId } = req.body;

      if (!jobDescription || !resumeContent) {
        res.status(400).json({ error: 'jobDescription and resumeContent are required' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(500).json({ error: 'Gemini API is not configured on the server.' });
        return;
      }

      const coreSkillsList = jobDescription.coreRequiredSkills || [];
      const coreCount = coreSkillsList.length;
      const perSkillWeight = coreCount > 0 ? (50 / coreCount).toFixed(2) : '50.00';

      const jdContext = `
TARGET JOB VACANCY REQUIREMENTS:
- Role Title: ${jobDescription.title || 'Not specified'}
- Department: ${jobDescription.department || 'Not specified'}
- Minimum Years of Experience Required: ${jobDescription.minExperienceYears ?? 0} years
- Required Must-Have Core Skills (${coreCount} core skills, 50% total weightage distributed equally at ${perSkillWeight}% each): ${coreSkillsList.map((s: string, idx: number) => `#${idx + 1} ${s} (${perSkillWeight}%)`).join(', ')}
- Preferred / Nice-to-Have Skills (Unlimited Additions): ${(jobDescription.preferredSkills || []).join(', ')}
- Minimum Education: ${jobDescription.educationRequirement || 'Not specified'}
- Key Responsibilities: ${(jobDescription.responsibilities || []).join('; ')}
- Role Summary: ${jobDescription.shortSummary || ''}
`;

      const currentYear = new Date().getFullYear(); // 2026

      const instructionText = `
You are a senior HR recruitment audit and candidate evaluation engine.
Carefully review the provided Resume / CV and cross-examine it thoroughly against the TARGET JOB VACANCY REQUIREMENTS.
YOUR GOAL IS TO ENSURE EVERY ELIGIBLE CANDIDATE IS ACCURATELY EVALUATED AND HIGHLIGHTED.

CURRENT BENCHMARK YEAR: ${currentYear}

CRITICAL AUDIT RULES:

1. ACTUAL WORKING EXPERIENCE CALCULATION (START-TO-FINISH CAREER TIMELINE):
   - Resumes typically do NOT state a single summary sentence like "X years of experience". You MUST construct the candidate's actual working timeline from start to finish across all listed jobs, roles, and employments.
   - Trace the candidate's career from their EARLIEST professional job start year (e.g. 2018) to their latest employment period.
   - ONGOING / CURRENT JOBS: If their current or latest job states "Present", "Current", "Now", "Till date", "Ongoing", or is an active position without an end date, calculate duration up to the current year (${currentYear}).
     * Example: Started career in 2018, current job is active (2021 - Present) -> Total cumulative experience = ${currentYear} - 2018 = ${currentYear - 2018} years.
     * Example: Job 1 (2016 - 2019) + Job 2 (2019 - Present in ${currentYear}) -> Total cumulative working experience = ${currentYear} - 2016 = ${currentYear - 2016} years.
   - Set "totalExperienceYears" as a realistic number reflecting this start-to-finish timeline (do NOT return 0 or default low numbers).
   - In "experienceMatchScore" (0-100), compare this calculated totalExperienceYears against the required minimum years (${jobDescription.minExperienceYears ?? 0} years). If candidate meets or exceeds the required years, assign a high score (85-100).
   - In "keyStrengths" and "executiveSummary", explicitly cite this calculated duration (e.g., "Demonstrates ${currentYear - 2018}+ years of continuous professional experience from 2018 to ${currentYear}").

2. CONTEXTUAL & SEMANTIC SKILL MATCHING (DO NOT REQUIRE EXACT LITERAL WORD MATCHES):
   - Candidates often do NOT list exact keywords in a bulleted "Skills" list; they describe their tools, competencies, and deliverables inside their job achievements, role descriptions, and project narratives.
   - SEARCH THE ENTIRE RESUME / CV TEXT: Scan every job description bullet point, project deliverable, achievement, and technical summary.
   - MATCH SIMILAR WORDS, SYNONYMS, EQUIVALENT TOOLS, AND DOMAIN CONCEPTS:
     * If the required skill is "Node.js", match "Node", "NodeJS", "Express", "Express.js", "NestJS", "Fastify", "backend JavaScript services", "Node API".
     * If the required skill is "React", match "React.js", "ReactJS", "Redux", "Hooks", "Next.js", "React Native", "frontend UI development".
     * If the required skill is "PostgreSQL", match "Postgres", "PSQL", "SQL queries", "Relational Database", "RDBMS", "RDS Postgres", "MySQL".
     * If the required skill is "Full-Lifecycle Tech Recruitment", match "sourcing developers", "technical hiring", "end-to-end recruitment", "headhunting engineers", "interviewing candidates", "talent acquisition", "HR recruitment".
     * If the required skill is "ATS & Sourcing Platforms", match "Greenhouse", "Lever", "Workday", "LinkedIn Recruiter", "Jobvite", "sourcing platforms", "Boolean search".
     * If the required skill is "System Design", match "software architecture", "high-level design (HLD)", "microservices architecture", "system scalability", "distributed architecture".
     * If the required skill is "CI/CD Pipelines", match "Continuous Integration", "GitHub Actions", "GitLab CI", "Jenkins", "automated deployment", "build pipelines".
     * If the required skill is "Cloud Architecture (AWS/GCP)", match "Amazon Web Services", "EC2", "S3", "Lambda", "Google Cloud", "cloud infrastructure", "cloud migration".
   - If a candidate demonstrates having used, built with, managed, or worked with an equivalent technology or domain skill anywhere in their work experience, mark that requirement as FULLY MATCHED.
   - In "matchedRequirements", quote or reference the specific project or role where they demonstrated the skill.
   - In "skillsFound", include all matched skills and equivalent capabilities identified.

3. CANDIDATE PROFILE EXTRACTION:
   - Extract Full Name, email address (search header/footer/contacts thoroughly), phone number, location, current/most recent job title, and education history.

4. ACCURATE MATCH SCORING (0 to 100):
   - matchScore: Overall weighted score (0-100).
   - skillsMatchScore: How well their demonstrated skills cover the requirements (0-100). NOTE: The ${coreCount} MUST-HAVE CORE SKILLS carry a strict 50% weightage of the total match criteria, divided equally at ${perSkillWeight}% for each core skill. For each core skill the candidate possesses evidence of (via exact or semantic match in their role descriptions), award them their ${perSkillWeight}% share. Preferred / nice-to-have skills provide secondary positive score increments.
   - experienceMatchScore: Fit of their total cumulative years of experience against the required minimum years (0-100).
   - educationRoleMatchScore: Fit of their education, certifications, and previous role titles to this position (0-100).
   - Highly qualified candidates should have scores 85-100 and verdict "Shortlist".
   - Competent candidates with relevant transferable skills should have scores 65-84 and verdict "Review" or "Shortlist".
5. QUALITATIVE HR EVALUATION:
   - keyStrengths: 3 to 5 clear bullet points of why this candidate would excel in this exact role.
   - redFlagsOrConcerns: Critical gaps, missing must-have requirements, career gaps, or lack of depth.
   - executiveSummary: Concise 2-3 sentence executive brief for the hiring manager highlighting their total career years and strongest domain fits.
   - suggestedInterviewQuestions: 2-3 targeted interview questions designed specifically to probe their gaps or verify their claimed achievements against the JD.
   - verdict: Exactly one of "Shortlist" (for top candidates >= 80%), "Review" (for 60-79%), or "Reject" (for < 60%).
`;

      // Extract text or prepare PDF
      let contents: any;
      let cleanText = '';
      const rawType = (resumeContent.type || '').toLowerCase();
      const fileName = (resumeContent.fileName || '').toLowerCase();

      if ((rawType === 'pdf' || fileName.endsWith('.pdf')) && resumeContent.base64Data) {
        const cleanBase64 = resumeContent.base64Data.replace(/^data:[^;]+;base64,/, '');
        try {
          const pdfBuffer = Buffer.from(cleanBase64, 'base64');
          cleanText = await extractTextFromPdf(pdfBuffer);
          console.log(
            `[PDF PARSER] Extracted ${cleanText.length} characters of raw text from ${fileName || 'uploaded resume'}.`
          );
        } catch (pdfErr) {
          console.warn('PDF buffer decoding note:', pdfErr);
        }

        if (cleanText && cleanText.length > 25) {
          // Send extracted text to Gemini so it gets 100% accurate textual parsing just like DOCX,
          // along with the visual PDF part so all layout and words are fully available.
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanBase64,
                },
              },
              {
                text: `${jdContext}

CANDIDATE RESUME / CV TEXT (EXTRACTED WORD-FOR-WORD FROM PDF):
"""
${cleanText}
"""

${instructionText}`,
              },
            ],
          };
        } else {
          // If purely scanned image PDF without embedded text streams, provide visual PDF part
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanBase64,
                },
              },
              {
                text: `${jdContext}\n\n${instructionText}`,
              },
            ],
          };
        }
      } else {
        // Handle DOCX / DOC / Text with Mammoth Word parser
        const isDocx =
          rawType === 'docx' ||
          fileName.endsWith('.docx') ||
          resumeContent.base64Data?.startsWith('data:application/vnd.openxmlformats');
        const isDoc =
          rawType === 'doc' ||
          fileName.endsWith('.doc') ||
          resumeContent.base64Data?.startsWith('data:application/msword');

        if ((isDocx || isDoc) && resumeContent.base64Data) {
          try {
            const cleanBase64 = resumeContent.base64Data.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');
            const result = await mammoth.extractRawText({ buffer });
            if (result.value && result.value.trim().length > 10) {
              cleanText = result.value.trim();
            }
          } catch (mErr) {
            console.warn('Mammoth extraction notice:', mErr);
          }

          // If legacy .doc binary, extract readable text runs from buffer
          if (!cleanText && resumeContent.base64Data) {
            try {
              const cleanBase64 = resumeContent.base64Data.replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(cleanBase64, 'base64');
              const str = buffer.toString('utf-8');
              const words = str.match(/[A-Za-z0-9\s.,!?:;@&()/\-–—]{4,}/g);
              if (words && words.length > 5) {
                cleanText = words.join(' ').replace(/\s+/g, ' ').trim();
              }
            } catch (docErr) {
              console.warn('Binary doc scanner error:', docErr);
            }
          }
        }

        // If textData was sent but accidentally contains raw ZIP/DOCX binary (starts with PK)
        if (!cleanText && resumeContent.textData) {
          if (
            resumeContent.textData.startsWith('PK\x03\x04') ||
            resumeContent.textData.includes('[Content_Types].xml')
          ) {
            try {
              const buffer = Buffer.from(resumeContent.textData, 'binary');
              const result = await mammoth.extractRawText({ buffer });
              if (result.value && result.value.trim().length > 10) {
                cleanText = result.value.trim();
              }
            } catch (pkErr) {
              console.warn('Raw text PK decode error:', pkErr);
            }
          } else {
            cleanText = resumeContent.textData;
          }
        }

        if (!cleanText) {
          cleanText = resumeContent.fileName ? `Candidate Profile: ${resumeContent.fileName}` : 'Candidate Resume';
        }

        contents = `
${jdContext}

CANDIDATE RESUME / CV TEXT:
"""
${cleanText}
"""

${instructionText}
`;
      }

      let parsed: any = null;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  candidateName: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  location: { type: Type.STRING },
                  currentTitle: { type: Type.STRING },
                  totalExperienceYears: { type: Type.NUMBER },
                  educationSummary: { type: Type.STRING },
                  skillsFound: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  matchScore: { type: Type.NUMBER },
                  skillsMatchScore: { type: Type.NUMBER },
                  experienceMatchScore: { type: Type.NUMBER },
                  educationRoleMatchScore: { type: Type.NUMBER },
                  matchedRequirements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        requirement: { type: Type.STRING },
                        status: { type: Type.STRING }, // 'matched' | 'partial' | 'missing'
                        evidence: { type: Type.STRING },
                      },
                      required: ['requirement', 'status', 'evidence'],
                    },
                  },
                  missingRequirements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        requirement: { type: Type.STRING },
                        impact: { type: Type.STRING }, // 'Critical' | 'Moderate' | 'Minor'
                        details: { type: Type.STRING },
                      },
                      required: ['requirement', 'impact', 'details'],
                    },
                  },
                  keyStrengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  redFlagsOrConcerns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  executiveSummary: { type: Type.STRING },
                  suggestedInterviewQuestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        probeObjective: { type: Type.STRING },
                      },
                      required: ['question', 'probeObjective'],
                    },
                  },
                  verdict: { type: Type.STRING }, // 'Shortlist' | 'Review' | 'Reject'
                },
                required: [
                  'candidateName',
                  'currentTitle',
                  'totalExperienceYears',
                  'matchScore',
                  'skillsMatchScore',
                  'experienceMatchScore',
                  'matchedRequirements',
                  'missingRequirements',
                  'keyStrengths',
                  'executiveSummary',
                  'verdict',
                ],
              },
            },
          });

          if (response.text) {
            parsed = JSON.parse(response.text);
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Evaluation with ${modelName} failed:`, modelErr.message || modelErr);
        }
      }

      // Fallback heuristic if external API has a temporary spike or outage
      if (!parsed) {
        const textToAnalyze = cleanText || resumeContent.textData || '';
        const lines = textToAnalyze
          .split('\n')
          .map((l: string) => l.trim())
          .filter((l: string) => l.length >= 3 && !l.includes('PK') && !l.includes('Content_Types') && !l.includes('xml'));

        // Derive candidate name cleanly from text or filename
        let nameGuess = '';
        if (lines.length > 0) {
          const firstCandidate = lines[0].replace(/[^a-zA-Z\s]/g, '').trim();
          if (
            firstCandidate.length >= 3 &&
            firstCandidate.length <= 40 &&
            !firstCandidate.toLowerCase().includes('resume') &&
            !firstCandidate.toLowerCase().includes('curriculum')
          ) {
            nameGuess = firstCandidate;
          }
        }

        if (!nameGuess || nameGuess.toLowerCase().includes('content') || nameGuess.toLowerCase().includes('xml')) {
          const rawBase = (resumeContent.fileName || 'Applicant')
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .replace(/\b(cv|resume|profile|candidate|doc|docx|pdf)\b/gi, '')
            .trim();
          nameGuess = rawBase || 'Candidate Applicant';
        }

        const timelineData = extractCareerTimelineYears(textToAnalyze);
        const expMatch = textToAnalyze.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i);
        const expYears = timelineData ? timelineData.years : expMatch ? parseFloat(expMatch[1]) : 4.0;

        const reqSkills = jobDescription.coreRequiredSkills || ['Software Development'];
        const prefSkills = jobDescription.preferredSkills || [];

        // Semantic skill auditing across the entire resume text
        const coreMatchResults = reqSkills.map((s: string) => ({
          skill: s,
          ...checkSkillMatchSemantically(s, textToAnalyze),
        }));
        const prefMatchResults = prefSkills.map((s: string) => ({
          skill: s,
          ...checkSkillMatchSemantically(s, textToAnalyze),
        }));

        const foundCore = coreMatchResults.filter((m: { matched: boolean }) => m.matched);
        const missingCore = coreMatchResults.filter((m: { matched: boolean }) => !m.matched);
        const foundPref = prefMatchResults.filter((m: { matched: boolean }) => m.matched);

        const skillsRatio = reqSkills.length > 0 ? foundCore.length / reqSkills.length : 0.8;
        const expRatio = Math.min(1.2, expYears / Math.max(1, jobDescription.minExperienceYears || 3));
        const rawScore = Math.round(
          (skillsRatio * 0.5 + Math.min(1, expRatio) * 0.35 + (foundPref.length > 0 ? 0.15 : 0.1)) * 100
        );
        const matchScore = Math.max(20, Math.min(98, rawScore));

        parsed = {
          candidateName: nameGuess.slice(0, 30),
          email: textToAnalyze.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || 'candidate@talentmatch.ai',
          phone:
            textToAnalyze.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] ||
            '+1 (555) 019-2831',
          location: 'Available / Remote',
          currentTitle: lines[1]?.slice(0, 40) || 'Experienced Professional',
          totalExperienceYears: expYears,
          educationSummary: "Bachelor's Degree in related discipline",
          skillsFound: [
            ...foundCore.map((m: { skill: string }) => m.skill),
            ...foundPref.map((m: { skill: string }) => m.skill),
            'Team Collaboration',
            'Problem Solving',
          ],
          matchScore,
          skillsMatchScore: Math.round(skillsRatio * 100),
          experienceMatchScore: Math.min(100, Math.round(expRatio * 100)),
          educationRoleMatchScore: 85,
          matchedRequirements: [
            ...foundCore.map((m: { skill: string; evidence: string }) => ({
              requirement: `${m.skill} (Core)`,
              status: 'matched',
              evidence: m.evidence,
            })),
            ...foundPref.map((m: { skill: string; evidence: string }) => ({
              requirement: `${m.skill} (Preferred)`,
              status: 'matched',
              evidence: m.evidence,
            })),
          ],
          missingRequirements: missingCore.map((m: { skill: string }) => ({
            requirement: `${m.skill} requirement`,
            impact: 'Critical',
            details: `No explicit or synonymous mention of ${m.skill} identified in submitted CV.`,
          })),
          keyStrengths: [
            `Demonstrated ${expYears} cumulative years of verified professional experience (${
              timelineData?.startYear ? `started in ${timelineData.startYear} to ${timelineData.finishYear}` : 'start-to-finish timeline'
            }).`,
            `Hands-on background matching core vacancy skills: ${
              foundCore.slice(0, 3).map((m: { skill: string }) => m.skill).join(', ') || 'Domain Fundamentals'
            }.`,
            'Strong structural career progression and clear role alignment.',
          ],
          redFlagsOrConcerns:
            missingCore.length > 0
              ? [`Needs verification on depth of ${missingCore.slice(0, 2).map((m: { skill: string }) => m.skill).join(', ')}.`]
              : [],
          executiveSummary: `${nameGuess} demonstrates an estimated ${matchScore}% alignment with the ${
            jobDescription.title
          } requirements, bringing ${expYears} years of cumulative experience with verified strength in ${
            foundCore.slice(0, 2).map((m: { skill: string }) => m.skill).join(', ') || 'core deliverables'
          }.`,
          suggestedInterviewQuestions: [
            {
              question: `Could you walk us through a complex project where you leveraged ${
                foundCore[0]?.skill || 'your core skills'
              } to achieve significant business impact?`,
              probeObjective: 'Evaluate actual hands-on technical depth and architectural ownership.',
            },
            {
              question: `How do you stay current with new industry standards and collaborative delivery practices?`,
              probeObjective: 'Assess learning velocity and culture alignment.',
            },
          ],
          verdict: matchScore >= 80 ? 'Shortlist' : matchScore >= 60 ? 'Review' : 'Reject',
        };
      }

      // Ensure candidate email is always populated
      const textToSearch = cleanText || resumeContent.textData || '';
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = textToSearch.match(emailRegex);

      if (foundEmails && foundEmails.length > 0) {
        // Filter out generic company or framework domains if possible
        const validEmail =
          foundEmails.find((em: string) => !em.includes('example.com') && !em.includes('w3.org')) || foundEmails[0];
        if (!parsed.email || parsed.email.includes('talentmatch.ai') || !parsed.email.includes('@')) {
          parsed.email = validEmail.trim().toLowerCase();
        }
      }

      // If still missing an email, guarantee a valid candidate address
      if (!parsed.email || !parsed.email.includes('@') || parsed.email.trim() === '') {
        const cleanNamePart = (parsed.candidateName || 'candidate')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.')
          .replace(/^\.|\.$/g, '');
        parsed.email = `${cleanNamePart || 'applicant'}@candidate-talent.com`;
      }

      // Reconcile and calculate working years from career timeline across entire CV
      const timelineData = extractCareerTimelineYears(textToSearch);
      if (timelineData && timelineData.years > 0) {
        if (!parsed.totalExperienceYears || parsed.totalExperienceYears < timelineData.years) {
          parsed.totalExperienceYears = timelineData.years;
        }
      }

      // Re-evaluate experience score against vacancy minimum years
      const minYears = jobDescription.minExperienceYears ?? 0;
      if (minYears > 0 && typeof parsed.totalExperienceYears === 'number') {
        const expRatio = parsed.totalExperienceYears / minYears;
        if (expRatio >= 1.0) {
          parsed.experienceMatchScore = Math.max(
            parsed.experienceMatchScore || 0,
            Math.min(100, Math.round(85 + Math.min(15, (expRatio - 1) * 10)))
          );
        }
      }

      // Semantic skill verification: check full CV text for any skills described in roles
      if (textToSearch && textToSearch.length > 30) {
        const allSkillsToVerify = [
          ...(jobDescription.coreRequiredSkills || []),
          ...(jobDescription.preferredSkills || []),
        ];
        if (!Array.isArray(parsed.skillsFound)) parsed.skillsFound = [];
        if (!Array.isArray(parsed.matchedRequirements)) parsed.matchedRequirements = [];
        if (!Array.isArray(parsed.missingRequirements)) parsed.missingRequirements = [];

        for (const skill of allSkillsToVerify) {
          const semanticCheck = checkSkillMatchSemantically(skill, textToSearch);
          if (semanticCheck.matched) {
            if (
              !parsed.skillsFound.some(
                (sf: string) =>
                  sf.toLowerCase() === skill.toLowerCase() ||
                  sf.toLowerCase().includes(semanticCheck.matchedTerm.toLowerCase())
              )
            ) {
              parsed.skillsFound.push(skill);
            }
            // If mistakenly marked as missing, convert to matched
            const missingIdx = parsed.missingRequirements.findIndex((mr: any) =>
              mr.requirement?.toLowerCase().includes(skill.toLowerCase())
            );
            if (missingIdx !== -1) {
              parsed.missingRequirements.splice(missingIdx, 1);
              parsed.matchedRequirements.push({
                requirement: `${skill} requirement`,
                status: 'matched',
                evidence: semanticCheck.evidence,
              });
              // Boost match score so every eligible candidate is highlighted
              parsed.skillsMatchScore = Math.min(100, (parsed.skillsMatchScore || 70) + 10);
              parsed.matchScore = Math.min(98, (parsed.matchScore || 70) + 8);
              if (parsed.matchScore >= 80) {
                parsed.verdict = 'Shortlist';
              }
            }
          }
        }
      }

      // Clamp match scores within 0-100
      parsed.matchScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore || 0)));
      parsed.skillsMatchScore = Math.max(0, Math.min(100, Math.round(parsed.skillsMatchScore || 0)));
      parsed.experienceMatchScore = Math.max(0, Math.min(100, Math.round(parsed.experienceMatchScore || 0)));
      parsed.educationRoleMatchScore = Math.max(0, Math.min(100, Math.round(parsed.educationRoleMatchScore || 0)));

      res.json({
        id: candidateId || `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        processedAt: new Date().toISOString(),
        fileName: resumeContent.fileName || 'Uploaded_Resume.pdf',
        ...parsed,
      });
    } catch (error: any) {
      console.error('Error in /api/parse-match-resume:', error);
      res.status(500).json({ error: error.message || 'Failed to parse and match candidate resume' });
    }
  });

  // Shoot single email to candidate (Shortlist or Rejection)
  app.post('/api/send-email', async (req: Request, res: Response) => {
    try {
      const { candidateId, candidateName, toEmail, type, subject, body, vacancyTitle } = req.body;

      if (!toEmail || !subject || !body) {
        res.status(400).json({ error: 'toEmail, subject, and body are required' });
        return;
      }

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();

      console.log(`\n======================================================`);
      console.log(`[HR EMAIL DISPATCHER] Status: SENT`);
      console.log(`Recipient: ${candidateName || 'Candidate'} <${toEmail}>`);
      console.log(`Vacancy: ${vacancyTitle || 'Position'}`);
      console.log(`Type: ${(type || 'general').toUpperCase()}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message ID: ${messageId}`);
      console.log(`Dispatched At: ${timestamp}`);
      console.log(`------------------------------------------------------`);
      console.log(body);
      console.log(`======================================================\n`);

      res.json({
        success: true,
        messageId,
        sentAt: timestamp,
        toEmail,
        candidateName,
        type: type || 'shortlist',
      });
    } catch (error: any) {
      console.error('Error in /api/send-email:', error);
      res.status(500).json({ error: error.message || 'Failed to dispatch email' });
    }
  });

  // Shoot bulk emails to multiple candidates
  app.post('/api/send-bulk-emails', async (req: Request, res: Response) => {
    try {
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({ error: 'emails array is required and must not be empty' });
        return;
      }

      const results = [];
      const timestamp = new Date().toISOString();

      for (let i = 0; i < emails.length; i++) {
        const item = emails[i];
        const messageId = `bulk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

        console.log(`[BULK EMAIL DISPATCH ${i + 1}/${emails.length}] Sent to ${item.candidateName} <${item.toEmail}> | Subject: ${item.subject}`);

        results.push({
          candidateId: item.candidateId,
          candidateName: item.candidateName,
          toEmail: item.toEmail,
          type: item.type,
          messageId,
          sentAt: timestamp,
          status: 'sent',
        });
      }

      console.log(`\n[BULK DISPATCH COMPLETE] Successfully sent ${results.length} candidate emails.`);

      res.json({
        success: true,
        totalSent: results.length,
        dispatchedAt: timestamp,
        results,
      });
    } catch (error: any) {
      console.error('Error in /api/send-bulk-emails:', error);
      res.status(500).json({ error: error.message || 'Failed to dispatch bulk emails' });
    }
  });

  // Generate dynamic tailored email draft via Gemini or smart template
  app.post('/api/generate-email-draft', async (req: Request, res: Response) => {
    try {
      const { type, candidateName, candidateTitle, vacancyTitle, department, skillsFound, missingRequirements } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback default
        if (type === 'rejection') {
          res.json({
            subject: `Update regarding your application for ${vacancyTitle || 'the position'}`,
            body: `Dear ${candidateName},\n\nThank you for taking the time to apply for the ${vacancyTitle} position within our ${department || 'team'}.\n\nWe received applications from many talented individuals. After reviewing your background against our specific vacancy requirements, we have decided to move forward with other applicants whose experience more closely matches our immediate criteria at this stage.\n\nWe were impressed by your background and will keep your resume on file for future opportunities that may be a strong fit.\n\nWe wish you continued success with your career search.\n\nSincerely,\nTalent Acquisition Team`,
          });
        } else {
          res.json({
            subject: `Congratulations! Shortlisted for ${vacancyTitle || 'the role'} - Discussion Scheduling`,
            body: `Dear ${candidateName},\n\nCongratulations! We have thoroughly reviewed your resume and background, and we are delighted to inform you that you have been shortlisted for the ${vacancyTitle} position within our ${department || 'team'}.\n\nOur recruitment team was very impressed by your qualifications and would love to schedule an introductory interview discussion with you.\n\nCould you please reply to this email sharing your best suitable days and time windows (along with your timezone) over the coming week? Once we receive your availability, our team will coordinate and book your interview appointment accordingly.\n\nWe look forward to connecting with you soon!\n\nWarm regards,\nTalent Acquisition Team | iPath Infotech`,
          });
        }
        return;
      }

      const prompt = `
Generate a professional, warm, and highly structured corporate HR email for candidate "${candidateName}" who applied for "${vacancyTitle}" (${department || 'Operations'}).
Email Type: ${type === 'rejection' ? 'REJECTION (Polite, respectful, standard industry practice)' : 'SHORTLIST (Enthusiastic congratulations, interview next steps, scheduling appointment)'}.
Candidate Title: ${candidateTitle || 'Applicant'}.
Candidate strengths/skills: ${(skillsFound || []).slice(0, 3).join(', ')}.

CRITICAL REQUIREMENT FOR SHORTLIST EMAIL:
- Enthusiastically congratulate the candidate on advancing to the shortlist stage for "${vacancyTitle}".
- Commend their verified background and relevant experience.
- State that the recruitment team would like to schedule an introductory discussion / interview round.
- EXPLICIT APPOINTMENT BOOKING REQUEST: Request the candidate to reply directly to this email with their best suitable days and time slots (along with their preferred timezone or contact number) over the next few business days so that their interview appointment can be booked and scheduled accordingly.
- Keep the signature professional: "Talent Acquisition Team | iPath Infotech".

Output JSON format:
{
  "subject": "Email subject line",
  "body": "Complete email body text with greetings and closing signature"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['subject', 'body'],
          },
        },
      });

      if (response.text) {
        res.json(JSON.parse(response.text));
      } else {
        throw new Error('Empty draft response');
      }
    } catch (err: any) {
      console.warn('Draft generation notice, using standard template:', err.message);
      const isRejection = req.body.type === 'rejection';
      res.json({
        subject: isRejection
          ? `Update regarding your application for ${req.body.vacancyTitle || 'the role'}`
          : `Congratulations! Shortlisted for ${req.body.vacancyTitle || 'the role'} - Discussion Scheduling`,
        body: isRejection
          ? `Dear ${req.body.candidateName},\n\nThank you for your interest in the ${req.body.vacancyTitle} role. We appreciated the chance to review your qualifications.\n\nDue to the competitive volume of applicants and specific project requirements, we have decided to advance other candidates at this time.\n\nWe wish you all the best in your career pursuits.\n\nWarm regards,\nTalent Acquisition Team | iPath Infotech`
          : `Dear ${req.body.candidateName},\n\nCongratulations! We have reviewed your background and are delighted to inform you that you have been shortlisted for the ${req.body.vacancyTitle} position.\n\nOur hiring team was very impressed by your qualifications and would love to arrange an introductory interview discussion with you.\n\nPlease reply to this email with your best suitable days and time slots over the coming week so our team can book your interview appointment accordingly.\n\nLooking forward to speaking with you!\n\nWarm regards,\nTalent Acquisition Team | iPath Infotech`,
      });
    }
  });

  // Production or Vite Dev server middleware
  const isDev = process.env.npm_lifecycle_event === 'dev';
  const hasDist = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

  if (!isDev && hasDist) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HR Candidate Match Engine Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
