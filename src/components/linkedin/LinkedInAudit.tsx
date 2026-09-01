import { CheckCircle2, AlertTriangle, ChevronRight, Briefcase, MapPin, Building, GraduationCap } from 'lucide-react';
import { LinkedInProfile, LinkedInAudit as LinkedInAuditType } from '@/types/linkedin';
import { LinkedInRewrites } from './LinkedInRewrites';

export function LinkedInAudit({ profile, audit }: { profile: LinkedInProfile, audit: LinkedInAuditType }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* Left Column: Profile Snapshot & Score */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          
          <h4 className="text-sm font-bold text-[#60A5FA] uppercase tracking-wider mb-2">AI-Generated Assessment</h4>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-6xl font-black text-white">{audit.total_score}</span>
            <span className="text-xl text-[#94A3B8] font-bold mb-1">/100</span>
          </div>
          <p className="text-sm text-[#94A3B8]">
            Good foundation. A few strategic changes could significantly improve your recruiter visibility.
          </p>

          <div className="mt-8 space-y-4">
            <ScoreBar label="Headline" score={audit.headline_score} max={20} />
            <ScoreBar label="About" score={audit.about_score} max={20} />
            <ScoreBar label="Experience" score={audit.experience_score} max={25} />
            <ScoreBar label="Skills" score={audit.skills_score} max={20} />
            <ScoreBar label="Keywords" score={audit.keywords_score} max={15} />
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 border-b border-[#1E3A5F] pb-2">Profile Snapshot</h4>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#94A3B8] mb-1">Headline</p>
              <p className="text-sm text-white font-medium">{profile.headline || 'Not provided'}</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
              <MapPin className="w-4 h-4" /> {profile.location || 'Location not specified'}
            </div>

            <div>
              <p className="text-xs text-[#94A3B8] mb-2">Current Role</p>
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-[#60A5FA] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">{profile.current_title || 'N/A'}</p>
                  <p className="text-xs text-[#94A3B8]">{profile.current_company || ''}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#94A3B8] mb-2">Top Skills Detected</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.slice(0, 5).map((s, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-[#1E3A5F]/50 text-xs text-[#60A5FA] border border-[#1E3A5F]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Audit Details & Rewrites */}
      <div className="xl:col-span-2 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-6">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> What's Working
            </h4>
            <ul className="space-y-3">
              {audit.strengths?.map((s, i) => (
                <li key={i} className="text-sm text-[#94A3B8] flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-6">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> What's Holding You Back
            </h4>
            <ul className="space-y-3">
              {audit.weaknesses?.map((w, i) => (
                <li key={i} className="text-sm text-[#94A3B8] flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl p-6">
           <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 border-b border-[#1E3A5F] pb-2">
             Recommended Actions
           </h4>
           <div className="space-y-4 mb-8">
             {audit.recommendations?.map((r, i) => (
               <div key={i} className="flex gap-4 p-4 rounded-xl bg-[#07111F] border border-[#1E3A5F]">
                 <div className="text-xl font-black text-[#1E3A5F]">{(i + 1).toString().padStart(2, '0')}</div>
                 <p className="text-sm text-white pt-1">{r}</p>
               </div>
             ))}
           </div>

           {audit.rewrites && audit.rewrites.length > 0 && (
             <LinkedInRewrites rewrites={audit.rewrites} />
           )}
        </div>

      </div>
    </div>
  );
}

function ScoreBar({ label, score, max }: { label: string, score: number, max: number }) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#94A3B8] uppercase tracking-wider">{label}</span>
        <span className="text-white font-medium">{score} / {max}</span>
      </div>
      <div className="w-full h-1.5 bg-[#07111F] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#2563EB] rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
