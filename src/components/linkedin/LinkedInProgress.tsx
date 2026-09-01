import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LinkedInImport } from '@/types/linkedin';

export function LinkedInProgress({ 
  importId, 
  onComplete, 
  onError 
}: { 
  importId: string, 
  onComplete: (profile: any, audit: any) => void,
  onError: () => void 
}) {
  const [status, setStatus] = useState<LinkedInImport | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/linkedin/import/${importId}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);

          if (data.status === 'completed') {
            clearInterval(interval);
            // Fetch the completed profile and audit
            const [profileRes, auditRes] = await Promise.all([
              fetch('/api/linkedin/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
              fetch('/api/linkedin/audit', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            ]);
            if (profileRes.ok && auditRes.ok) {
              onComplete(await profileRes.json(), await auditRes.json());
            }
          } else if (data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    };

    interval = setInterval(poll, 1500);
    poll(); // Initial call

    return () => clearInterval(interval);
  }, [importId, onComplete]);

  const getStepStatus = (stepProgress: number) => {
    const current = status?.progress || 0;
    if (status?.status === 'failed') return 'failed';
    if (current >= stepProgress) return 'completed';
    if (current > stepProgress - 25) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-2xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-8 backdrop-blur-sm">
        
        {status?.status === 'failed' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Import Failed</h3>
            <p className="text-red-400 mb-6">{status.error_message || 'Something went wrong while reading your profile.'}</p>
            <button 
              onClick={onError}
              className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2563EB] text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-white">
                {status?.status === 'queued' ? 'Queued...' :
                 status?.status === 'extracting' ? 'Extracting profile data...' :
                 status?.status === 'analyzing' ? 'Analyzing recruiter visibility...' :
                 'Processing...'}
              </h3>
              <span className="text-2xl font-bold text-[#60A5FA]">{status?.progress || 0}%</span>
            </div>

            <div className="w-full h-3 bg-[#07111F] rounded-full overflow-hidden border border-[#1E3A5F] mb-10 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-700 ease-out"
                style={{ width: `${status?.progress || 0}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]"></div>
              </div>
            </div>

            <div className="space-y-4">
              <StepItem 
                label="Uploading profile" 
                status={getStepStatus(25)} 
              />
              <StepItem 
                label="Extracting structured data" 
                status={getStepStatus(60)} 
              />
              <StepItem 
                label="Running AI visibility audit" 
                status={getStepStatus(100)} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepItem({ label, status }: { label: string, status: 'pending' | 'active' | 'completed' | 'failed' }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${
      status === 'active' ? 'border-[#2563EB]/50 bg-[#2563EB]/10' : 
      status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 
      status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
      'border-transparent'
    }`}>
      {status === 'completed' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : status === 'active' ? (
        <Loader2 className="w-5 h-5 text-[#60A5FA] shrink-0 animate-spin" />
      ) : status === 'failed' ? (
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#1E3A5F] shrink-0"></div>
      )}
      <span className={`font-medium ${
        status === 'active' ? 'text-[#60A5FA]' :
        status === 'completed' ? 'text-emerald-400' :
        status === 'failed' ? 'text-red-400' :
        'text-[#475569]'
      }`}>
        {label}
      </span>
    </div>
  );
}
