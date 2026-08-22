import { useState } from 'react';
import { RiskProfile, RiskScores, calculateRisk } from '@/lib/riskEngine';
import { AIAnalysis as AIAnalysisType, generateAIAnalysis } from '@/lib/gemini';
import { RiskScoreMeter } from '@/components/dashboard/RiskScoreMeter';
import { RiskBreakdown } from '@/components/dashboard/RiskBreakdown';
import { SkillSimulator } from '@/components/dashboard/SkillSimulator';
import { AIAnalysis } from '@/components/dashboard/AIAnalysis';
import { ATSOptimizer } from '@/components/dashboard/ATSOptimizer';
import { HistoryTab } from '@/components/dashboard/HistoryTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { PricingTab } from '@/components/dashboard/PricingTab';
import { ResumeBuilder } from '@/components/dashboard/ResumeBuilder';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, RefreshCw, LayoutDashboard, Target, History, Settings, LogOut, CreditCard, FileText } from 'lucide-react';

export function MainApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'risk' | 'ats' | 'builder' | 'history' | 'pricing' | 'settings'>('dashboard');
  const [profile, setProfile] = useState<RiskProfile>({
    industry: '',
    role: '',
    skills: [],
    experience: 0,
    companyStatus: 'public'
  });
  
  const [currentSkill, setCurrentSkill] = useState('');
  const [scores, setScores] = useState<RiskScores | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoricalAssessment, setSelectedHistoricalAssessment] = useState<any>(null);

  const handleSelectHistoricalAssessment = (assessment: any) => {
    setSelectedHistoricalAssessment(assessment);
    setActiveTab('ats');
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !profile.skills.includes(currentSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, currentSkill.trim()] });
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const handleAnalyze = async () => {
    if (!profile.industry || !profile.role || profile.skills.length === 0) {
      setError("Please fill in all fields and add at least one skill.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const calculatedScores = calculateRisk(profile);
      setScores(calculatedScores);
      
      const aiResult = await generateAIAnalysis(profile, calculatedScores);
      setAnalysis(aiResult);

      // Save risk assessment to backend
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/risk/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            industry: profile.industry,
            role: profile.role,
            skills: profile.skills,
            experience: profile.experience,
            companyStatus: profile.companyStatus,
            totalScore: calculatedScores.totalScore,
            level: calculatedScores.level
          })
        }).catch(err => console.error("Failed to save risk assessment", err));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScores(null);
    setAnalysis(null);
    setProfile({
      industry: '',
      role: '',
      skills: [],
      experience: 0,
      companyStatus: 'public'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Risk-Ume</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('risk')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'risk' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <ShieldAlert className="w-4 h-4" />
                Risk Score
              </button>
              <button 
                onClick={() => setActiveTab('ats')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'ats' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <Target className="w-4 h-4" />
                ATS Optimizer
              </button>
              <button 
                onClick={() => setActiveTab('builder')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'builder' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <FileText className="w-4 h-4" />
                Resume Builder
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button 
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'pricing' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <CreditCard className="w-4 h-4" />
                Pricing
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'dashboard' ? (
          <DashboardTab onNavigate={setActiveTab} />
        ) : activeTab === 'risk' ? (
          !scores ? (
            <div className="max-w-xl mx-auto py-12">
              <div className="text-center mb-8">
                <ShieldAlert className="mx-auto h-12 w-12 text-indigo-600" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                  Layoff Risk Assessment
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your professional details to calculate your vulnerability score.
                </p>
              </div>

              <Card className="border-0 shadow-xl">
                <CardContent className="pt-6">
                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="role">Current Role</Label>
                        <Input
                          id="role"
                          required
                          placeholder="e.g. Senior Data Analyst"
                          value={profile.role}
                          onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          required
                          placeholder="e.g. Technology"
                          value={profile.industry}
                          onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          min="0"
                          required
                          value={profile.experience}
                          onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyStatus">Company Type</Label>
                        <select
                          id="companyStatus"
                          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={profile.companyStatus}
                          onChange={(e) => setProfile({ ...profile, companyStatus: e.target.value as any })}
                        >
                          <option value="public">Public Company</option>
                          <option value="private">Private Company</option>
                          <option value="startup">Startup</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="skills">Key Skills</Label>
                      <div className="mt-1 flex gap-2">
                        <Input
                          id="skills"
                          placeholder="e.g. Python, React, SQL"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        />
                        <Button type="button" onClick={handleAddSkill} variant="secondary">Add</Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                          <Badge key={skill} variant="default" className="px-2 py-1 flex items-center gap-1">
                            {skill}
                            <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 font-bold">×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                      {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Analyzing...</> : <><Target className="mr-2 h-5 w-5" /> Generate Assessment</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
              <div className="lg:col-span-1 space-y-8">
                <Card className="overflow-hidden border-0 shadow-md">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-6 pb-0">
                    <h2 className="text-lg font-semibold text-gray-900 text-center mb-6">Overall Risk Score</h2>
                    <RiskScoreMeter score={scores.totalScore} level={scores.level} />
                  </div>
                  <CardContent className="pt-6 bg-white">
                    <div className="space-y-4">
                      {[
                        { label: 'Industry Risk', value: scores.industryRisk },
                        { label: 'Company Risk', value: scores.companyRisk },
                        { label: 'Role Redundancy', value: scores.roleRedundancy },
                        { label: 'Automation Risk', value: scores.automationRisk },
                        { label: 'Skill Obsolescence', value: scores.skillObsolescence },
                        { label: 'Market Demand Gap', value: scores.marketDemand },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium">{item.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-0">
                  <CardHeader><CardTitle className="text-lg">Risk Breakdown</CardTitle></CardHeader>
                  <CardContent><RiskBreakdown scores={scores} /></CardContent>
                </Card>
                <Card className="shadow-md border-0">
                  <CardContent className="pt-6"><SkillSimulator profile={profile} currentScores={scores} /></CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {profile.role.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{profile.role}</h2>
                      <p className="text-gray-500">{profile.industry} • {profile.experience} years exp • {profile.companyStatus} company</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(s => <Badge key={s} variant="secondary" className="bg-gray-100 text-gray-700">{s}</Badge>)}
                  </div>
                </div>
                {analysis && <AIAnalysis analysis={analysis} />}
              </div>
            </div>
          )
        ) : activeTab === 'ats' ? (
          <ATSOptimizer 
            onNavigate={setActiveTab} 
            initialAssessment={selectedHistoricalAssessment}
            onClearInitial={() => setSelectedHistoricalAssessment(null)}
          />
        ) : activeTab === 'builder' ? (
          <ResumeBuilder />
        ) : activeTab === 'history' ? (
          <HistoryTab onSelectAssessment={handleSelectHistoricalAssessment} />
        ) : activeTab === 'pricing' ? (
          <PricingTab />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Module Coming Soon</h3>
            <p className="text-gray-500 max-w-xs">We are currently working on the {activeTab} module.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return user ? <MainApp /> : <AuthScreen />;
}

