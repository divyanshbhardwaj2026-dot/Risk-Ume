import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';

interface ATSUploadPanelProps {
  value: string;
  onTextChange: (text: string) => void;
}

export function ATSUploadPanel({ value, onTextChange }: ATSUploadPanelProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onTextChange(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl group-hover:bg-indigo-100/50 transition-colors" />
        <label className="relative flex flex-col items-center justify-center py-8 cursor-pointer">
          <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
          <span className="text-sm font-medium text-gray-600">Click to upload text file or drag and drop</span>
          <span className="text-xs text-gray-400 mt-1">Supports .txt files (PDF/DOCX support coming soon)</span>
          <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
        </label>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-500 uppercase">Or Paste Resume Text</Label>
        <textarea
          className="w-full h-64 p-4 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
          placeholder="Paste your full resume here..."
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
        />
      </div>
    </div>
  );
}
