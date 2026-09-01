import { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, ArrowLeft, Target, FileText, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { LinkedInImportCard } from './LinkedInImportCard';
import { LinkedInProgress } from './LinkedInProgress';
import { LinkedInAudit } from './LinkedInAudit';

export function LinkedInTab() {
  const [importStatus, setImportStatus] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [view, setView] = useState<'import' | 'progress' | 'audit'>('import');

  // Load existing profile/audit on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const [profileRes, auditRes] = await Promise.all([
          fetch('/api/linkedin/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/linkedin/audit', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        ]);
        
        if (profileRes.ok && auditRes.ok) {
          const p = await profileRes.json();
          const a = await auditRes.json();
          if (p && a) {
            setProfile(p);
            setAudit(a);
            setView('audit');
          }
        }
      } catch (e) {
        console.error('Failed to load existing LinkedIn data', e);
      }
    };
    loadExisting();
  }, []);

  const handleUploadStart = (importId: string) => {
    setImportStatus({ id: importId, status: 'queued', progress: 0 });
    setView('progress');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your imported LinkedIn profile?')) return;
    try {
      await fetch('/api/linkedin/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(null);
      setAudit(null);
      setImportStatus(null);
      setView('import');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[80vh] rounded-2xl bg-[#07111F] text-white p-6 sm:p-10 shadow-2xl overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB] rounded-full blur-[120px] opacity-20 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#60A5FA] rounded-full blur-[100px] opacity-10 -ml-20 -mb-20"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-[#1E3A5F] pb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="bg-[#2563EB] text-white p-2 rounded-lg"><Target className="w-6 h-6" /></span>
              LinkedIn Profile Audit
            </h2>
            <p className="text-[#94A3B8] mt-2">
              Synchronize your LinkedIn presence with your career intelligence profile.
            </p>
          </div>
          {view === 'audit' && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-white border border-[#1E3A5F] hover:bg-[#1E3A5F] rounded-lg transition-colors"
            >
              Start Fresh
            </button>
          )}
        </div>

        {view === 'import' && (
          <LinkedInImportCard onUploadStart={handleUploadStart} />
        )}

        {view === 'progress' && importStatus && (
          <LinkedInProgress 
            importId={importStatus.id} 
            onComplete={(p, a) => {
              setProfile(p);
              setAudit(a);
              setView('audit');
            }}
            onError={() => setView('import')}
          />
        )}

        {view === 'audit' && audit && profile && (
          <LinkedInAudit profile={profile} audit={audit} />
        )}
      </div>
    </div>
  );
}
