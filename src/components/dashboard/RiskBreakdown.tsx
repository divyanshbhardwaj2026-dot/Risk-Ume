import { RiskScores } from "@/lib/riskEngine";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

interface RiskBreakdownProps {
  scores: RiskScores;
}

export function RiskBreakdown({ scores }: RiskBreakdownProps) {
  const data = [
    { subject: 'Industry Risk', A: scores.industryRisk, fullMark: 100 },
    { subject: 'Company Risk', A: scores.companyRisk, fullMark: 100 },
    { subject: 'Role Redundancy', A: scores.roleRedundancy, fullMark: 100 },
    { subject: 'Automation Risk', A: scores.automationRisk, fullMark: 100 },
    { subject: 'Skill Obsolescence', A: scores.skillObsolescence, fullMark: 100 },
    { subject: 'Market Demand', A: scores.marketDemand, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Radar name="Risk Score" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
