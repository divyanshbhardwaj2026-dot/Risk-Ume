export interface RiskProfile {
  industry: string;
  role: string;
  skills: string[];
  experience: number;
  companyStatus: 'public' | 'startup' | 'private';
}

export interface RiskScores {
  industryRisk: number;
  companyRisk: number;
  roleRedundancy: number;
  automationRisk: number;
  skillObsolescence: number;
  marketDemand: number;
  totalScore: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function calculateRisk(profile: RiskProfile): RiskScores {
  const indHash = hashString(profile.industry.toLowerCase());
  const roleHash = hashString(profile.role.toLowerCase());
  
  // Base scores 20-80
  let industryRisk = 20 + (indHash % 60);
  let roleRedundancy = 20 + (roleHash % 60);
  let automationRisk = 20 + ((indHash + roleHash) % 60);
  
  // Company risk based on status
  let companyRisk = 50;
  if (profile.companyStatus === 'startup') companyRisk = 70;
  if (profile.companyStatus === 'public') companyRisk = 40;
  if (profile.companyStatus === 'private') companyRisk = 55;

  // Skill obsolescence: fewer skills = higher risk. 
  // We can also check if they have "AI", "Machine Learning", "Cloud" to lower risk.
  const modernSkills = ['ai', 'machine learning', 'cloud', 'aws', 'azure', 'gcp', 'python', 'data', 'react', 'node'];
  const userSkillsLower = profile.skills.map(s => s.toLowerCase());
  const modernCount = userSkillsLower.filter(s => modernSkills.some(ms => s.includes(ms))).length;
  
  let skillObsolescence = Math.max(10, 80 - (profile.skills.length * 5) - (modernCount * 10));
  
  // Market demand: experience helps lower it slightly, but too much experience might increase obsolescence if skills aren't updated.
  let marketDemand = Math.max(10, 60 - (profile.experience * 2) - (modernCount * 5));

  // Adjust automation risk based on skills (more modern skills = less automation risk)
  automationRisk = Math.max(10, automationRisk - (modernCount * 5));

  const totalScore = 
    (industryRisk * 0.25) +
    (companyRisk * 0.20) +
    (roleRedundancy * 0.15) +
    (automationRisk * 0.15) +
    (skillObsolescence * 0.15) +
    (marketDemand * 0.10);

  let level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (totalScore >= 85) level = 'critical';
  else if (totalScore >= 65) level = 'high';
  else if (totalScore >= 35) level = 'moderate';

  return {
    industryRisk,
    companyRisk,
    roleRedundancy,
    automationRisk,
    skillObsolescence,
    marketDemand,
    totalScore,
    level
  };
}
