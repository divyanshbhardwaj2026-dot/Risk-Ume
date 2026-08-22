import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, FileText, Briefcase, Download } from 'lucide-react';
import { analyzeATS, ATSAnalysis } from '@/lib/gemini';
import { ATSUploadPanel } from './ATSUploadPanel';
import { JobDescriptionInput } from './JobDescriptionInput';
import { ATSScoreMeter } from './ATSScoreMeter';
import { GapAnalysisCard } from './GapAnalysisCard';
import { ResumeDiffViewer } from './ResumeDiffViewer';
import { IntelligencePanel } from './IntelligencePanel';
import { motion, AnimatePresence } from 'motion/react';
import { generateOptimizedResume } from '@/lib/docxGenerator';

export function ATSOptimizer({ 
  onNavigate,
  initialAssessment,
  onClearInitial
}: { 
  onNavigate?: (tab: 'dashboard' | 'risk' | 'ats' | 'builder' | 'history' | 'pricing' | 'settings') => void;
  initialAssessment?: any;
  onClearInitial?: () => void;
}) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAssessment) {
      setResumeText(initialAssessment.resume_text || '');
      setJobDescription(initialAssessment.job_description || '');
      setAnalysis({
        score_before: initialAssessment.ats_score_before,
        score_after: initialAssessment.ats_score_after,
        match_level: initialAssessment.match_level,
        resume_health: initialAssessment.resume_health,
        interview_prob_before: initialAssessment.interview_prob_before,
        interview_prob_after: initialAssessment.interview_prob_after,
        missing_skills: initialAssessment.missing_skills || [],
        missing_keywords: initialAssessment.missing_keywords || [],
        hard_skills: initialAssessment.hard_skills || [],
        soft_skills: initialAssessment.soft_skills || [],
        formatting_score: initialAssessment.formatting_score,
        quantified_achievements_score: initialAssessment.quantified_achievements_score,
        grammar_tone_score: initialAssessment.grammar_tone_score,
        salary_readiness_score: initialAssessment.salary_readiness_score,
        salary_band_estimate: initialAssessment.salary_band_estimate,
        career_gap_risk: initialAssessment.career_gap_risk,
        keyword_decay: initialAssessment.keyword_decay || [],
        culture_fit_score: initialAssessment.culture_fit_score,
        multi_role_conflict: initialAssessment.multi_role_conflict,
        hiring_manager_profile: initialAssessment.hiring_manager_profile || [],
        add_lines: initialAssessment.add_lines || [],
        remove_lines: initialAssessment.remove_lines || [],
        rewrite_lines: initialAssessment.rewrite_lines || [],
        impact_prediction: initialAssessment.impact_prediction || { visibility_increase: '', key_improvement: '' }
      });
    }
  }, [initialAssessment]);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      setError('Please provide both your resume and the job description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeATS(resumeText, jobDescription);
      setAnalysis(result);

      // Save to backend
      const assessmentId = crypto.randomUUID();
      const recommendations = [
        ...result.add_lines.map(l => ({ id: crypto.randomUUID(), type: 'add', content: l.content, impact_score: parseFloat(l.impact) || 0 })),
        ...result.remove_lines.map(l => ({ id: crypto.randomUUID(), type: 'remove', content: l.content, impact_score: 0 })),
        ...result.rewrite_lines.map(l => ({ id: crypto.randomUUID(), type: 'rewrite', content: `${l.before} -> ${l.after}`, impact_score: 0 }))
      ];

      await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: assessmentId,
          resume_text: resumeText,
          job_description: jobDescription,
          score_before: result.score_before,
          score_after: result.score_after,
          match_level: result.match_level,
          resume_health: result.resume_health,
          interview_prob_before: result.interview_prob_before,
          interview_prob_after: result.interview_prob_after,
          formatting_score: result.formatting_score,
          quantified_achievements_score: result.quantified_achievements_score,
          grammar_tone_score: result.grammar_tone_score,
          salary_readiness_score: result.salary_readiness_score,
          salary_band_estimate: result.salary_band_estimate,
          career_gap_risk: result.career_gap_risk,
          culture_fit_score: result.culture_fit_score,
          multi_role_conflict: result.multi_role_conflict,
          recommendations,
          // Full fidelity fields:
          add_lines: result.add_lines,
          remove_lines: result.remove_lines,
          rewrite_lines: result.rewrite_lines,
          missing_skills: result.missing_skills,
          missing_keywords: result.missing_keywords,
          hard_skills: result.hard_skills,
          soft_skills: result.soft_skills,
          keyword_decay: result.keyword_decay,
          hiring_manager_profile: result.hiring_manager_profile,
          impact_prediction: result.impact_prediction
        })
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
    setResumeText('');
    setJobDescription('');
    onClearInitial?.();
  };

  return (
    <div className="space-y-8">
      {!analysis ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-indigo-600 text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle>Step 1: Your Resume</CardTitle>
                </div>
                <CardDescription className="text-indigo-100">
                  Paste your resume text or upload a text file.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ATSUploadPanel onTextChange={setResumeText} value={resumeText} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <CardTitle>Step 2: Job Description</CardTitle>
                </div>
                <CardDescription className="text-emerald-100">
                  Paste the full job description you're targeting.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <JobDescriptionInput onTextChange={setJobDescription} value={jobDescription} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col items-center gap-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            <Button 
              size="lg" 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full max-w-md h-14 text-lg font-bold shadow-xl shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                'Analyze & Optimize Resume'
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>New Analysis</Button>
                {onNavigate && (
                  <Button 
                    variant="outline" 
                    onClick={() => onNavigate('builder')}
                    className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Resume Builder
                  </Button>
                )}
                <Button 
                  onClick={() => generateOptimizedResume(resumeText, analysis)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download DOCX
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Score & Summary */}
              <div className="lg:col-span-1 space-y-8">
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-8">
                    <h3 className="text-center font-bold text-gray-900 mb-6">ATS Compatibility Score</h3>
                    <ATSScoreMeter 
                      before={analysis.score_before} 
                      after={analysis.score_after} 
                      level={analysis.match_level} 
                    />
                  </div>
                  <CardContent className="p-6 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Projected Improvement</p>
                        <p className="text-xs text-emerald-700">+{analysis.score_after - analysis.score_before} points increase</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Impact Prediction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Visibility Increase</p>
                      <p className="text-sm font-medium text-gray-900">{analysis.impact_prediction.visibility_increase}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Key Improvement</p>
                      <p className="text-sm font-medium text-gray-900">{analysis.impact_prediction.key_improvement}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <div className="lg:col-span-2 space-y-8">
                <IntelligencePanel analysis={analysis} />

                <GapAnalysisCard 
                  missingSkills={analysis.missing_skills} 
                  missingKeywords={analysis.missing_keywords} 
                  hardSkills={analysis.hard_skills}
                  softSkills={analysis.soft_skills}
                />
                
                <ResumeDiffViewer 
                  addLines={analysis.add_lines}
                  removeLines={analysis.remove_lines}
                  rewriteLines={analysis.rewrite_lines}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
