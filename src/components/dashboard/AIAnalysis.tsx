import { AIAnalysis as AIAnalysisType } from "@/lib/gemini";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIAnalysisProps {
  analysis: AIAnalysisType;
}

export function AIAnalysis({ analysis }: AIAnalysisProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">AI Risk Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Top Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {analysis.top_risk_factors.map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Upgrade Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.skill_priorities.map((skill, i) => (
              <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                  <p className="text-sm text-gray-500 mt-1">{skill.reason}</p>
                </div>
                <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200 whitespace-nowrap">
                  Impact: {skill.impact}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Potential Career Pivots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.career_pivots.map((pivot, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                {pivot}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
