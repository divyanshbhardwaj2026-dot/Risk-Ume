import { GoogleGenAI, Type } from "@google/genai";
import { RiskProfile, RiskScores } from "./riskEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIAnalysis {
  summary: string;
  top_risk_factors: string[];
  recommendations: string[];
  career_pivots: string[];
  skill_priorities: { skill: string; reason: string; impact: string }[];
}

export interface ATSAnalysis {
  score_before: number;
  score_after: number;
  match_level: 'Low' | 'Moderate' | 'High';
  resume_health: number;
  interview_prob_before: number;
  interview_prob_after: number;
  missing_skills: string[];
  missing_keywords: string[];
  hard_skills: string[];
  soft_skills: string[];
  formatting_score: number;
  quantified_achievements_score: number;
  grammar_tone_score: number;
  salary_readiness_score: number;
  salary_band_estimate: string;
  career_gap_risk: string;
  keyword_decay: { keyword: string; trend: 'up' | 'down' }[];
  culture_fit_score: number;
  multi_role_conflict: string;
  hiring_manager_profile: string[];
  add_lines: { content: string; impact: string; reason: string }[];
  remove_lines: { content: string; reason: string }[];
  rewrite_lines: { before: string; after: string; reason: string }[];
  impact_prediction: {
    visibility_increase: string;
    key_improvement: string;
  };
}

export async function parseResumeToJSON(resumeText: string) {
  const prompt = `Parse the following resume text into a structured JSON format. 
  Extract personal information, work experience, education, projects, and skills.
  
  Resume Text:
  ${resumeText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personal: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING },
              lastName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              website: { type: Type.STRING },
              summary: { type: Type.STRING }
            }
          },
          work: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          edu: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                school: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          proj: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tech: { type: Type.STRING },
                url: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            }
          },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export interface HeatmapLine {
  text: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
}

export async function generateHeatmap(resumeText: string): Promise<HeatmapLine[]> {
  const prompt = `Analyze the following resume text and generate a recruiter readability heatmap.
  Assign a visibility score (0-100) to each significant line or bullet point based on keyword strength, action verbs, and quantified impact.
  Color mapping:
  - 60-100: green (strong)
  - 30-59: yellow (moderate)
  - 0-29: red (weak)
  
  Resume Text:
  ${resumeText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            score: { type: Type.NUMBER },
            color: { type: Type.STRING, enum: ['green', 'yellow', 'red'] }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export async function analyzeATS(resumeText: string, jobDescription: string): Promise<ATSAnalysis> {
  const prompt = `You are an expert ATS (Applicant Tracking System) optimizer. Analyze the provided resume against the job description.
  
  RESUME TEXT:
  ${resumeText}
  
  JOB DESCRIPTION:
  ${jobDescription}
  
  Perform a deep analysis and provide:
  1. An ATS compatibility score (0-100).
  2. A projected score if all recommendations are followed.
  3. A Resume Health score (0-100) based on formatting, keyword density, and skill freshness.
  4. Interview Probability Before Optimization (0-100).
  5. Interview Probability After Optimization (0-100).
  6. Missing skills and keywords.
  7. Hard skills vs Soft skills detected in the resume.
  8. Formatting & Parsability score (0-100).
  9. Quantified Achievements score (0-100) - penalty if no numbers present.
  10. Grammar & Tone score (0-100).
  11. Salary Negotiation Readiness score (0-100) and estimated salary band.
  12. Career Gap Risk analysis (e.g., "LOW (Tech Industry tolerant)").
  13. Keyword Decay Detection (flag outdated vs trending keywords).
  14. Personality & Culture Fit score (0-100) based on JD values vs resume tone.
  15. Multi-Role Conflict Detection (e.g., "Resume trying to target Backend + Product").
  16. Hiring Manager Risk Profiling (what the company prefers based on JD).
  17. Specific lines to add (Silent ATS Boosters) with reason.
  18. Specific lines to remove (vague/inefficient) with reason.
  19. Specific lines to rewrite for better impact with reason.
  20. Predicted impact of these changes.
  
  Provide your analysis in JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score_before: { type: Type.NUMBER },
          score_after: { type: Type.NUMBER },
          match_level: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
          resume_health: { type: Type.NUMBER },
          interview_prob_before: { type: Type.NUMBER },
          interview_prob_after: { type: Type.NUMBER },
          missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          hard_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          formatting_score: { type: Type.NUMBER },
          quantified_achievements_score: { type: Type.NUMBER },
          grammar_tone_score: { type: Type.NUMBER },
          salary_readiness_score: { type: Type.NUMBER },
          salary_band_estimate: { type: Type.STRING },
          career_gap_risk: { type: Type.STRING },
          keyword_decay: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down"] }
              },
              required: ["keyword", "trend"]
            }
          },
          culture_fit_score: { type: Type.NUMBER },
          multi_role_conflict: { type: Type.STRING },
          hiring_manager_profile: { type: Type.ARRAY, items: { type: Type.STRING } },
          add_lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                impact: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["content", "impact", "reason"]
            }
          },
          remove_lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["content", "reason"]
            }
          },
          rewrite_lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                before: { type: Type.STRING },
                after: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["before", "after", "reason"]
            }
          },
          impact_prediction: {
            type: Type.OBJECT,
            properties: {
              visibility_increase: { type: Type.STRING },
              key_improvement: { type: Type.STRING }
            },
            required: ["visibility_increase", "key_improvement"]
          }
        },
        required: [
            "score_before", "score_after", "match_level", "resume_health", 
            "interview_prob_before", "interview_prob_after", "missing_skills", 
            "missing_keywords", "hard_skills", "soft_skills", "formatting_score",
            "quantified_achievements_score", "grammar_tone_score", "salary_readiness_score",
            "salary_band_estimate", "career_gap_risk", "keyword_decay", "culture_fit_score",
            "multi_role_conflict", "hiring_manager_profile", "add_lines", "remove_lines", 
            "rewrite_lines", "impact_prediction"
          ]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as ATSAnalysis;
}

export async function generateAIAnalysis(profile: RiskProfile, scores: RiskScores): Promise<AIAnalysis> {
  const prompt = `You are a career risk analyst. Analyze this professional's layoff vulnerability and provide a clear, actionable explanation.

RESUME DATA:
- Current Role: ${profile.role}
- Industry: ${profile.industry}
- Years of Experience: ${profile.experience}
- Key Skills: ${profile.skills.join(', ')}
- Company Type: ${profile.companyStatus}

RISK SCORES (0-100, higher = more risk):
- Overall Risk: ${scores.totalScore.toFixed(1)} (${scores.level})
- Industry Stability: ${scores.industryRisk.toFixed(1)}
- Company Financial Health: ${scores.companyRisk.toFixed(1)}
- Role Redundancy: ${scores.roleRedundancy.toFixed(1)}
- Automation Risk: ${scores.automationRisk.toFixed(1)}
- Skill Obsolescence: ${scores.skillObsolescence.toFixed(1)}
- Market Demand Gap: ${scores.marketDemand.toFixed(1)}

Provide your analysis in JSON format. Be specific, data-driven, and constructive.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "2-3 sentence overview of risk level and primary drivers" },
          top_risk_factors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 specific factors with data" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable steps" },
          career_pivots: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 alternative roles that reduce risk" },
          skill_priorities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                reason: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ["skill", "reason", "impact"]
            }
          }
        },
        required: ["summary", "top_risk_factors", "recommendations", "career_pivots", "skill_priorities"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AIAnalysis;
}
