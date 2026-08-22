import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RiskProfile, RiskScores, calculateRisk } from '@/lib/riskEngine';

interface SkillSimulatorProps {
  profile: RiskProfile;
  currentScores: RiskScores;
}

export function SkillSimulator({ profile, currentScores }: SkillSimulatorProps) {
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [simulatedScores, setSimulatedScores] = useState<RiskScores | null>(null);
  
  const handleSimulate = () => {
    const newProfile = {
      ...profile,
      skills: [...profile.skills, ...addedSkills]
    };
    const newScores = calculateRisk(newProfile);
    setSimulatedScores(newScores);
  };
  
  const addSkill = () => {
    if (newSkill.trim() && !addedSkills.includes(newSkill.trim()) && !profile.skills.includes(newSkill.trim())) {
      setAddedSkills([...addedSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setAddedSkills(addedSkills.filter(s => s !== skill));
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">What-If Skill Simulator</h3>
        <p className="text-gray-500 text-sm">
          See how learning new skills would affect your risk score
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Skills to Add
        </label>
        <div className="flex gap-2 flex-wrap mb-4">
          {addedSkills.map(skill => (
            <Badge key={skill} variant="secondary" className="px-3 py-1 flex items-center gap-1">
              {skill}
              <button onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-gray-900 ml-1 font-bold">
                ×
              </button>
            </Badge>
          ))}
          {addedSkills.length === 0 && <span className="text-sm text-gray-400 italic">No skills added yet</span>}
        </div>
        <div className="flex gap-2">
          <Input 
            value={newSkill} 
            onChange={(e) => setNewSkill(e.target.value)} 
            placeholder="e.g. Machine Learning" 
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          />
          <Button onClick={addSkill} variant="outline">Add</Button>
        </div>
      </div>
      
      <Button onClick={handleSimulate} disabled={addedSkills.length === 0} className="w-full">
        Run Simulation
      </Button>
      
      {simulatedScores && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Simulation Results</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Original Score:</span>
            <span className="font-bold">{currentScores.totalScore.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">New Score:</span>
            <span className={`font-bold ${simulatedScores.totalScore < currentScores.totalScore ? 'text-green-600' : 'text-red-600'}`}>
              {simulatedScores.totalScore.toFixed(1)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Risk Reduction: </span>
            <span className="font-semibold text-green-600">
              {Math.max(0, currentScores.totalScore - simulatedScores.totalScore).toFixed(1)} points
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
