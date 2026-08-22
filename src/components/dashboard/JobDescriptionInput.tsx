import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface JobDescriptionInputProps {
  value: string;
  onTextChange: (text: string) => void;
}

export function JobDescriptionInput({ value, onTextChange }: JobDescriptionInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-500 uppercase">Paste Job Description</Label>
        <Textarea
          className="w-full h-[380px] p-4 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          placeholder="Paste the full job description here to identify keyword gaps..."
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
        />
      </div>
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
        <p className="text-xs text-emerald-800 leading-relaxed">
          <strong>Tip:</strong> Include the full text including requirements, responsibilities, and company info for the most accurate keyword matching.
        </p>
      </div>
    </div>
  );
}
