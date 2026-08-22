import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Brain, Users } from 'lucide-react';

interface GapAnalysisCardProps {
  missingSkills: string[];
  missingKeywords: string[];
  hardSkills?: string[];
  softSkills?: string[];
}

export function GapAnalysisCard({ missingSkills, missingKeywords, hardSkills = [], softSkills = [] }: GapAnalysisCardProps) {
  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Keyword & Skill Gaps
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                Missing Hard Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingSkills.length > 0 ? (
                  missingSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    All required skills found!
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Missing Industry Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.length > 0 ? (
                  missingKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    All critical keywords matched!
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(hardSkills.length > 0 || softSkills.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                <Brain className="w-4 h-4" /> Detected Hard Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                <Users className="w-4 h-4" /> Detected Soft Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
