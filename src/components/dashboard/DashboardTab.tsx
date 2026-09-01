import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ShieldAlert, Target, Activity, CheckCircle2, AlertCircle, FileText, Linkedin } from 'lucide-react';

export function DashboardTab({ onNavigate }: { onNavigate: (tab: 'risk' | 'ats' | 'linkedin') => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20">Loading dashboard...</div>;
  }

  const latest = data?.latestAssessment;
  const healthScore = latest?.resume_health || 0;
  const atsScore = latest?.ats_score_after || 0;
  const riskLevel = data?.latestRisk 
    ? (data.latestRisk.level.charAt(0).toUpperCase() + data.latestRisk.level.slice(1)) 
    : 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here is your career intelligence overview for this week.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onNavigate('ats')} className="bg-indigo-600 hover:bg-indigo-700">
            <Target className="w-4 h-4 mr-2" />
            Run New ATS Scan
          </Button>
          <Button variant="outline" onClick={() => onNavigate('risk')}>
            <ShieldAlert className="w-4 h-4 mr-2" />
            Check Market Trends
          </Button>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-600 mb-1">Resume Health</p>
                <h3 className="text-4xl font-bold text-gray-900">{healthScore}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
              Based on your latest scan
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">ATS Score (Latest)</p>
                <h3 className="text-4xl font-bold text-gray-900">{atsScore}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {latest ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                  Up from {latest.ats_score_before} before optimization
                </>
              ) : (
                'No scans yet'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Career Risk Level</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{riskLevel}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
              Market demand is shifting
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Intelligence */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Weekly Career Intelligence
            </CardTitle>
            <CardDescription>Market signals for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{data?.weeklyTrends.role} Demand</p>
                  <p className="text-sm text-gray-500">Industry-wide hiring volume</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                  {data?.weeklyTrends.demandChange}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Your Skill: "{data?.weeklyTrends.topSkill}"</p>
                  <p className="text-sm text-gray-500">Market trend analysis</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">
                  Trending {data?.weeklyTrends.skillTrend}
                </Badge>
              </div>
              
              {data?.weeklyTrends.relatedTrends?.map((trend: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{trend.name} Demand</p>
                    <p className="text-sm text-gray-500">Related technology</p>
                  </div>
                  <Badge className={`${trend.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} border-0`}>
                    {trend.change}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benchmarking & Probability */}
        <div className="space-y-8">
          <Card className="border-0 shadow-md bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
            <CardContent className="p-8 relative z-10">
              <h3 className="text-lg font-medium text-indigo-200 mb-2">Competitive Ranking</h3>
              <p className="text-3xl font-bold mb-4">
                You rank in the top <span className="text-emerald-400">{data?.benchmarking.percentile}%</span>
              </p>
              <p className="text-indigo-200 text-sm">
                Compared to other {data?.benchmarking.group} in our anonymized dataset.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Interview Probability Predictor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Current Likelihood</span>
                <span className="font-bold text-gray-900">{latest?.interview_prob_before || 42}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: `${latest?.interview_prob_before || 42}%` }}></div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">After Optimization</span>
                <span className="font-bold text-emerald-600">{latest?.interview_prob_after || 67}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${latest?.interview_prob_after || 67}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Based on ATS score, skill alignment, and role demand.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-[#07111F] to-[#1E3A5F] text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-[#60A5FA]" /> LinkedIn Sync
                  </h3>
                  <p className="text-sm text-[#94A3B8] mt-1">Connect your profile for recruiter visibility analysis.</p>
                </div>
              </div>
              <Button onClick={() => onNavigate('linkedin')} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-0">
                Audit LinkedIn Profile <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust & Credibility Layer */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Intelligence Powered By</h4>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span><strong>2,400+</strong> Job Descriptions Analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span><strong>18,000+</strong> Resumes Benchmarked</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Real-time Market Demand Signals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
