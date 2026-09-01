import { useState, useRef } from 'react';
import { UploadCloud, FileText, ClipboardList, Loader2 } from 'lucide-react';

export function LinkedInImportCard({ onUploadStart }: { onUploadStart: (importId: string) => void }) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file exported from LinkedIn.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        const res = await fetch('/api/linkedin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name, source: 'pdf' })
        });
        
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        onUploadStart(data.importId);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setError(e.message || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/linkedin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fileBase64: pasteText, fileName: 'pasted_profile.txt', source: 'paste' })
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onUploadStart(data.importId);
    } catch (e: any) {
      setError(e.message || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in duration-500">
      {/* Left Column: Instructions */}
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Save your profile to PDF</h3>
          <p className="text-[#94A3B8]">
            We never scrape LinkedIn. Export your own profile and we will audit it and rewrite it into what recruiters are actively searching for.
          </p>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1E3A5F] before:to-transparent">
          {[
            { step: '01', text: 'Open your LinkedIn profile on a desktop browser.' },
            { step: '02', text: "Click the 'More' button under your headline." },
            { step: '03', text: "Choose 'Save to PDF'." },
            { step: '04', text: 'Upload that PDF here.' }
          ].map((item, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#07111F] bg-[#1E3A5F] text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-[#2563EB]/20 z-10">
                {item.step}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#1E3A5F] bg-[rgba(255,255,255,0.02)] shadow-sm">
                <p className="text-sm text-[#94A3B8]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#60A5FA] shrink-0 mt-0.5" />
          <p className="text-sm text-[#60A5FA]">
            <strong>Privacy First:</strong> This is your own data, exported by you. We never log in as you or scrape your profile.
          </p>
        </div>
      </div>

      {/* Right Column: Upload/Paste */}
      <div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex border-b border-[#1E3A5F]">
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'upload' ? 'bg-[#2563EB]/10 text-[#60A5FA] border-b-2 border-[#2563EB]' : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}
            >
              <div className="flex items-center justify-center gap-2"><UploadCloud className="w-4 h-4" /> UPLOAD PDF</div>
            </button>
            <button
              onClick={() => setTab('paste')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'paste' ? 'bg-[#2563EB]/10 text-[#60A5FA] border-b-2 border-[#2563EB]' : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}
            >
              <div className="flex items-center justify-center gap-2"><ClipboardList className="w-4 h-4" /> PASTE TEXT</div>
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {tab === 'upload' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging ? 'border-[#60A5FA] bg-[#2563EB]/10' : 'border-[#1E3A5F] hover:border-[#2563EB]/50 hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <FileText className="w-12 h-12 text-[#60A5FA] mx-auto mb-4 opacity-80" />
                <h4 className="text-lg font-medium text-white mb-2">Drop your LinkedIn PDF here</h4>
                <p className="text-sm text-[#94A3B8] mb-6">PDF, up to 10MB</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Choose file'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-[300px]">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your LinkedIn profile text here..."
                  className="flex-1 w-full bg-[rgba(255,255,255,0.02)] border border-[#1E3A5F] rounded-xl p-4 text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none mb-4"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={uploading || !pasteText.trim()}
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Analyze profile →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
