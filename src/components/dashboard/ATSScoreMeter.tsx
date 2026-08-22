import { motion } from 'motion/react';

interface ATSScoreMeterProps {
  before: number;
  after: number;
  level: 'Low' | 'Moderate' | 'High';
}

export function ATSScoreMeter({ before, after, level }: ATSScoreMeterProps) {
  const getColor = (score: number) => {
    if (score < 50) return '#ef4444'; // red-500
    if (score < 75) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const circumference = 2 * Math.PI * 45;
  const offsetBefore = circumference - (before / 100) * circumference;
  const offsetAfter = circumference - (after / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="96"
          cy="96"
          r="45"
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        
        {/* After Optimization (Projected) */}
        <motion.circle
          cx="96"
          cy="96"
          r="45"
          fill="transparent"
          stroke={getColor(after)}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offsetAfter }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className="opacity-30"
        />

        {/* Before Optimization */}
        <motion.circle
          cx="96"
          cy="96"
          r="45"
          fill="transparent"
          stroke={getColor(before)}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offsetBefore }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-10px]">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-black text-gray-900"
        >
          {before}
        </motion.span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Score</span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          level === 'High' ? 'bg-emerald-100 text-emerald-700' :
          level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {level} Match
        </div>
        <p className="mt-2 text-xs text-gray-500 font-medium">
          Projected: <span className="text-emerald-600 font-bold">{after}/100</span>
        </p>
      </div>
    </div>
  );
}
