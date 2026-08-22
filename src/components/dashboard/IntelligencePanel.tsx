import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ATSAnalysis } from '@/lib/gemini';
import { CheckCircle2, AlertCircle, TrendingUp, TrendingDown, DollarSign, BrainCircuit, Users, FileText } from 'lucide-react';

interface IntelligencePanelProps {
  analysis: ATSAnalysis;
}

export function IntelligencePanel({ analysis }: IntelligencePanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Salary Readiness */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary Negotiation Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">{analysis.salary_readiness_score}</span>
              <span className="text-sm text-gray-500 mb-1">/ 100</span>
            </div>
            <p className="text-sm text-emerald-700 font-medium mb-1">
              Estimated Band: {analysis.salary_band_estimate}
            </p>
            <p className="text-xs text-gray-500">
              Based on achievement density, leadership verbs, and seniority signals.
            </p>
          </CardContent>
        </Card>

        {/* Culture Fit */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Personality & Culture Fit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">{analysis.culture_fit_score}</span>
              <span className="text-sm text-gray-500 mb-1">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Alignment between resume tone and inferred company values from JD.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formatting */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysis.formatting_score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Formatting & Parsability</p>
              <p className="text-lg font-bold text-gray-900">{analysis.formatting_score}/100</p>
            </div>
          </CardContent>
        </Card>

        {/* Quantified Achievements */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysis.quantified_achievements_score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Quantified Impact</p>
              <p className="text-lg font-bold text-gray-900">{analysis.quantified_achievements_score}/100</p>
            </div>
          </CardContent>
        </Card>

        {/* Grammar & Tone */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysis.grammar_tone_score > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Grammar & Tone</p>
              <p className="text-lg font-bold text-gray-900">{analysis.grammar_tone_score}/100</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks & Conflicts */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Career Risks & Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Career Gap Risk</p>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {analysis.career_gap_risk}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Multi-Role Conflict</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100">
                {analysis.multi_role_conflict || "No conflicts detected."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyword Decay */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-500" />
              Keyword Decay Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.keyword_decay.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{kw.keyword}</span>
                  {kw.trend === 'up' ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Trending Up
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Outdated
                    </Badge>
                  )}
                </div>
              ))}
              {analysis.keyword_decay.length === 0 && (
                <p className="text-sm text-gray-500">No significant keyword decay detected.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hiring Manager Profile */}
      <Card className="border-0 shadow-md bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-indigo-300">
            <Users className="w-4 h-4" />
            Hiring Manager Risk Profiling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-3">Based on the JD, the hiring manager likely prefers:</p>
          <ul className="space-y-2">
            {analysis.hiring_manager_profile.map((pref, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pref}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
