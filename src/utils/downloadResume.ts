import { CandidateResult } from '../types';

/**
 * Downloads candidate's original resume file (PDF/DOCX) or exports their complete
 * verified Resume Dossier directly to the recruiter's computer.
 */
export function downloadCandidateResume(candidate: CandidateResult) {
  // If original uploaded data exists (base64 Data URL)
  if (candidate.resumeData && candidate.resumeData.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = candidate.resumeData;
    const fallbackExt =
      candidate.resumeType === 'pdf'
        ? '.pdf'
        : candidate.resumeType === 'docx'
        ? '.docx'
        : '.txt';
    const filename =
      candidate.fileName ||
      `${candidate.candidateName.replace(/\s+/g, '_')}_Resume${fallbackExt}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // If textData is stored
  if (candidate.resumeData && !candidate.resumeData.startsWith('data:')) {
    const blob = new Blob([candidate.resumeData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = candidate.fileName || `${candidate.candidateName.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Comprehensive, clean Candidate Resume & Dossier download
  const safeName = candidate.candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Resume_Dossier.doc`;

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${candidate.candidateName} - Resume & Profile Dossier</title>
<style>
body { font-family: 'Calibri', 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 32px; max-width: 800px; margin: 0 auto; }
h1 { color: #0f172a; font-size: 24pt; margin-bottom: 4px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
.subtitle { font-size: 13pt; color: #2563eb; font-weight: bold; margin-bottom: 12px; }
.contact-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 10.5pt; color: #334155; margin-bottom: 24px; }
h2 { color: #1e3a8a; font-size: 13pt; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
p, li { font-size: 11pt; color: #334155; margin-bottom: 8px; }
ul, ol { padding-left: 20px; }
.badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 10pt; font-weight: bold; margin: 3px 4px 3px 0; border: 1px solid #bae6fd; }
.strength { color: #047857; font-weight: 600; }
.match-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 10px 14px; margin: 12px 0; font-size: 11pt; }
.footer { margin-top: 48px; font-size: 9pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; }
</style>
</head>
<body>
<h1>${candidate.candidateName}</h1>
<div class="subtitle">${candidate.currentTitle} &bull; ${candidate.totalExperienceYears} Years Cumulative Experience</div>

<div class="contact-info">
  <strong>Email:</strong> ${candidate.email || 'N/A'} &nbsp;|&nbsp;
  <strong>Phone:</strong> ${candidate.phone || 'N/A'} &nbsp;|&nbsp;
  <strong>Location:</strong> ${candidate.location || 'N/A'} &nbsp;|&nbsp;
  <strong>Match Score:</strong> ${candidate.matchScore}% &nbsp;|&nbsp;
  <strong>Verdict:</strong> ${candidate.verdict} &nbsp;|&nbsp;
  <strong>Status:</strong> ${candidate.shortlistStatus.toUpperCase()}
</div>

<h2>Executive Summary & Career Timeline</h2>
<p>${candidate.executiveSummary || 'Demonstrated professional track record with strong alignment to role requirements.'}</p>
<div class="match-box">
  <strong>Total Professional Experience:</strong> ${candidate.totalExperienceYears} years calculated start-to-finish across all employment tenures.
</div>

<h2>Core & Preferred Skills</h2>
<p>
${(candidate.skillsFound || []).map((s) => `<span class="badge">${s}</span>`).join(' ')}
</p>

<h2>Key Candidate Strengths</h2>
<ul>
${(candidate.keyStrengths || []).map((ks) => `<li class="strength">${ks}</li>`).join('')}
</ul>

<h2>Technical & Requirement Alignment Breakdown</h2>
<ul>
${(candidate.matchedRequirements || []).map((mr) => `<li><strong>${mr.requirement}</strong>: ${mr.evidence} [${mr.status}]</li>`).join('')}
</ul>

${candidate.educationSummary ? `<h2>Education & Credentials</h2><p>${candidate.educationSummary}</p>` : ''}

${(candidate.suggestedInterviewQuestions || []).length > 0 ? `
<h2>Suggested Interview Discussion Points</h2>
<ol>
${candidate.suggestedInterviewQuestions.map((q) => `<li><strong>${q.question}</strong><br/><span style="color:#64748b; font-size:10pt;">Objective: ${q.probeObjective}</span></li>`).join('')}
</ol>
` : ''}

<div class="footer">
  Screened by <strong>iPath InfoTech</strong> Talent Acquisition &bull; Website: <a href="https://ipathinfotech.com/">https://ipathinfotech.com/</a><br/>
  Processed on ${new Date(candidate.processedAt || Date.now()).toLocaleDateString()} &bull; Application ID: ${candidate.id}
</div>
</body>
</html>
`;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
