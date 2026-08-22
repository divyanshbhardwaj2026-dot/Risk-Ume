import { useEffect, useState } from 'react';

interface RiskScoreMeterProps {
  score: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
}

export function RiskScoreMeter({ score, level }: RiskScoreMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);
  
  const getColor = () => {
    switch(level) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-900';
    }
  };

  const getColorHex = () => {
    switch(level) {
      case 'low': return '#16a34a'; // green-600
      case 'moderate': return '#ca8a04'; // yellow-600
      case 'high': return '#ea580c'; // orange-600
      case 'critical': return '#dc2626'; // red-600
      default: return '#111827';
    }
  };
  
  const getBackground = () => {
    const percentage = (animatedScore / 100) * 360;
    return `conic-gradient(${getColorHex()} ${percentage}deg, #e5e7eb ${percentage}deg)`;
  };
  
  return (
    <div className="relative w-64 h-64 mx-auto">
      <div 
        className="w-full h-full rounded-full transition-all duration-300 ease-out"
        style={{ background: getBackground() }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full w-56 h-56 flex flex-col items-center justify-center shadow-inner">
            <span className={`text-6xl font-bold ${getColor()}`}>
              {Math.round(animatedScore)}
            </span>
            <span className="text-gray-500 text-sm uppercase mt-2 font-medium tracking-wider">Risk Score</span>
            <span className={`text-xs mt-1 uppercase font-bold ${getColor()}`}>{level}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
