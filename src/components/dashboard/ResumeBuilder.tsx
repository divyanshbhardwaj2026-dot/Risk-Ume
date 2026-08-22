import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, X, Printer, Loader2, Sparkles, Upload, Download, Eye, LayoutTemplate } from 'lucide-react';
import { analyzeATS, parseResumeToJSON, ATSAnalysis, generateHeatmap, HeatmapLine } from '@/lib/gemini';
import { downloadResumeDocx } from '@/lib/docxGenerator';

type TemplateType = 'classic' | 'modern' | 'minimal';

export function ResumeBuilder() {
  const [template, setTemplate] = useState<TemplateType>('classic');
  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', jobTitle: '', email: '', phone: '', location: '', website: '', summary: ''
  });
  const [work, setWork] = useState<any[]>([]);
  const [edu, setEdu] = useState<any[]>([]);
  const [proj, setProj] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    template: true, personal: true, summary: true, work: true, edu: true, proj: true, skills: true
  });

  const [jobDescription, setJobDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'heatmap'>('edit');
  const [heatmapData, setHeatmapData] = useState<HeatmapLine[]>([]);
  const [isGeneratingHeatmap, setIsGeneratingHeatmap] = useState(false);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const toggleSection = (sec: string) => setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPersonal({ ...personal, [e.target.name]: e.target.value });
  };

  const addEntry = (type: 'work' | 'edu' | 'proj') => {
    const newEntry = { id: Date.now() };
    if (type === 'work') setWork([...work, newEntry]);
    if (type === 'edu') setEdu([...edu, newEntry]);
    if (type === 'proj') setProj([...proj, newEntry]);
  };

  const updateEntry = (type: 'work' | 'edu' | 'proj', id: number, field: string, value: string) => {
    const updateFn = (list: any[]) => list.map(item => item.id === id ? { ...item, [field]: value } : item);
    if (type === 'work') setWork(updateFn(work));
    if (type === 'edu') setEdu(updateFn(edu));
    if (type === 'proj') setProj(updateFn(proj));
  };

  const removeEntry = (type: 'work' | 'edu' | 'proj', id: number) => {
    if (type === 'work') setWork(work.filter(item => item.id !== id));
    if (type === 'edu') setEdu(edu.filter(item => item.id !== id));
    if (type === 'proj') setProj(proj.filter(item => item.id !== id));
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const newSkills = skillInput.split(',').map(s => s.trim()).filter(s => s && !skills.includes(s));
    setSkills([...skills, ...newSkills]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));

  const handlePrint = () => {
    window.print();
  };

  const handleImport = async () => {
    if (!importText) return;
    setIsParsing(true);
    try {
      const parsed = await parseResumeToJSON(importText);
      if (parsed.personal) setPersonal({ ...personal, ...parsed.personal });
      if (parsed.work) setWork(parsed.work.map((w: any, i: number) => ({ ...w, id: Date.now() + i })));
      if (parsed.edu) setEdu(parsed.edu.map((e: any, i: number) => ({ ...e, id: Date.now() + i })));
      if (parsed.proj) setProj(parsed.proj.map((p: any, i: number) => ({ ...p, id: Date.now() + i })));
      if (parsed.skills) setSkills(parsed.skills);
      setShowImport(false);
      setImportText('');
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume');
    } finally {
      setIsParsing(false);
    }
  };

  const getResumeText = () => {
    let text = `${personal.firstName} ${personal.lastName}\n${personal.summary}\n\n`;
    text += `EXPERIENCE\n` + work.map(w => `${w.title} at ${w.company}\n${w.desc}`).join('\n\n') + '\n\n';
    text += `EDUCATION\n` + edu.map(e => `${e.degree} at ${e.school}\n${e.desc}`).join('\n\n') + '\n\n';
    text += `PROJECTS\n` + proj.map(p => `${p.title}\n${p.desc}`).join('\n\n') + '\n\n';
    text += `SKILLS\n` + skills.join(', ');
    return text;
  };

  const handleAnalyze = async () => {
    if (!jobDescription) return;
    setIsAnalyzing(true);
    try {
      const text = getResumeText();
      const result = await analyzeATS(text, jobDescription);
      setAnalysis(result);

      // Save version to backend
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/resume/version', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            resume_json: { personal, work, edu, proj, skills },
            ats_score: result.score_after
          })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!jobDescription) return;
    const timer = setTimeout(() => {
      handleAnalyze();
    }, 3000); // 3 second debounce
    return () => clearTimeout(timer);
  }, [personal, work, edu, proj, skills, jobDescription]);

  const applyRewrite = (before: string, after: string) => {
    let applied = false;
    const newWork = work.map(w => {
      if (w.desc && w.desc.includes(before)) {
        applied = true;
        return { ...w, desc: w.desc.replace(before, after) };
      }
      return w;
    });
    if (applied) { setWork(newWork); return; }

    const newProj = proj.map(p => {
      if (p.desc && p.desc.includes(before)) {
        applied = true;
        return { ...p, desc: p.desc.replace(before, after) };
      }
      return p;
    });
    if (applied) { setProj(newProj); return; }

    if (personal.summary && personal.summary.includes(before)) {
      setPersonal({ ...personal, summary: personal.summary.replace(before, after) });
      return;
    }
  };

  const applyAdd = (content: string) => {
    setPersonal({ ...personal, summary: personal.summary ? `${personal.summary}\n${content}` : content });
  };

  const applyRemove = (content: string) => {
    let applied = false;
    const newWork = work.map(w => {
      if (w.desc && w.desc.includes(content)) {
        applied = true;
        return { ...w, desc: w.desc.replace(content, '').trim() };
      }
      return w;
    });
    if (applied) { setWork(newWork); return; }

    const newProj = proj.map(p => {
      if (p.desc && p.desc.includes(content)) {
        applied = true;
        return { ...p, desc: p.desc.replace(content, '').trim() };
      }
      return p;
    });
    if (applied) { setProj(newProj); return; }

    if (personal.summary && personal.summary.includes(content)) {
      setPersonal({ ...personal, summary: personal.summary.replace(content, '').trim() });
      return;
    }
  };

  const handleAutoOptimize = async () => {
    if (!analysis) return;
    setIsAutoOptimizing(true);
    
    let newPersonal = { ...personal };
    let newWork = [...work];
    let newProj = [...proj];
    
    // Apply Removes
    analysis.remove_lines.forEach(line => {
      newWork = newWork.map(w => w.desc?.includes(line.content) ? { ...w, desc: w.desc.replace(line.content, '').trim() } : w);
      newProj = newProj.map(p => p.desc?.includes(line.content) ? { ...p, desc: p.desc.replace(line.content, '').trim() } : p);
      if (newPersonal.summary?.includes(line.content)) {
        newPersonal.summary = newPersonal.summary.replace(line.content, '').trim();
      }
    });

    // Apply Rewrites
    analysis.rewrite_lines.forEach(line => {
      newWork = newWork.map(w => w.desc?.includes(line.before) ? { ...w, desc: w.desc.replace(line.before, line.after) } : w);
      newProj = newProj.map(p => p.desc?.includes(line.before) ? { ...p, desc: p.desc.replace(line.before, line.after) } : p);
      if (newPersonal.summary?.includes(line.before)) {
        newPersonal.summary = newPersonal.summary.replace(line.before, line.after);
      }
    });

    // Apply Adds
    analysis.add_lines.forEach(line => {
      newPersonal.summary = newPersonal.summary ? `${newPersonal.summary}\n${line.content}` : line.content;
    });

    setPersonal(newPersonal);
    setWork(newWork);
    setProj(newProj);
    
    // Clear analysis so it recalculates
    setAnalysis(null);
    setIsAutoOptimizing(false);
  };

  const handleGenerateHeatmap = async () => {
    setIsGeneratingHeatmap(true);
    setViewMode('heatmap');
    try {
      const text = getResumeText();
      const result = await generateHeatmap(text);
      setHeatmapData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingHeatmap(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-8rem)]">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-preview, #resume-preview * { visibility: visible; }
          #resume-preview { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; }
          .no-print { display: none !important; }
        }
        .resume-doc {
          background: #ffffff;
          width: 210mm;
          min-height: 297mm;
          box-shadow: 0 4px 24px rgba(26,26,46,0.10), 0 0 0 1px rgba(0,0,0,0.04);
          position: relative;
          font-size: 10.5pt;
          line-height: 1.55;
          color: #1a1a2e;
          font-family: 'DM Sans', sans-serif;
          margin: 0 auto;
          transform-origin: top center;
        }
        /* Classic */
        .resume-doc.classic { padding: 0; }
        .resume-doc.classic .r-header { background: #1a1a2e; color: #fff; padding: 36px 44px 28px; border-bottom: 4px solid #c8a96e; }
        .resume-doc.classic .r-name { font-family: 'Playfair Display', serif; font-size: 26pt; font-weight: 700; color: #fff; letter-spacing: 0.01em; line-height: 1.1; margin-bottom: 4px; }
        .resume-doc.classic .r-contact { display: flex; flex-wrap: wrap; gap: 4px 20px; margin-top: 10px; font-size: 8.5pt; color: #c0bfbf; }
        .resume-doc.classic .r-body { padding: 28px 44px; }
        .resume-doc.classic .r-section { margin-bottom: 22px; }
        .resume-doc.classic .r-section-title { font-family: 'Playfair Display', serif; font-size: 11pt; font-weight: 700; color: #1a1a2e; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 2px solid #c8a96e; padding-bottom: 5px; margin-bottom: 12px; }
        .resume-doc.classic .r-summary { font-size: 9.5pt; color: #444; }
        .resume-doc.classic .r-entry { margin-bottom: 14px; }
        .resume-doc.classic .r-entry-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .resume-doc.classic .r-entry-title { font-weight: 600; font-size: 10pt; color: #1a1a2e; }
        .resume-doc.classic .r-entry-org { font-size: 9pt; color: #c8a96e; font-weight: 500; }
        .resume-doc.classic .r-entry-date { font-size: 8.5pt; color: #888; font-family: 'DM Mono', monospace; white-space: nowrap; }
        .resume-doc.classic .r-entry-desc { font-size: 9pt; color: #555; margin-top: 5px; white-space: pre-wrap; }
        .resume-doc.classic .r-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .resume-doc.classic .r-skill { background: #1a1a2e; color: #e8d5b0; padding: 3px 11px; border-radius: 3px; font-size: 8pt; font-family: 'DM Mono', monospace; }

        /* Modern */
        .resume-doc.modern { display: grid; grid-template-columns: 170px 1fr; padding: 0; }
        .resume-doc.modern .r-sidebar { background: #1a1a2e; padding: 32px 20px; }
        .resume-doc.modern .r-sidebar-name { font-family: 'Playfair Display', serif; font-size: 16pt; font-weight: 700; color: #c8a96e; line-height: 1.2; margin-bottom: 18px; word-break: break-word; }
        .resume-doc.modern .r-sidebar-section { margin-bottom: 20px; }
        .resume-doc.modern .r-sidebar-title { font-size: 7pt; font-weight: 600; color: #c8a96e; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid rgba(200,169,110,0.3); padding-bottom: 5px; margin-bottom: 8px; }
        .resume-doc.modern .r-sidebar-item { font-size: 8pt; color: #ccc; margin-bottom: 3px; }
        .resume-doc.modern .r-sidebar-skill { display: inline-block; background: rgba(200,169,110,0.15); color: #e8d5b0; padding: 2px 8px; border-radius: 2px; font-size: 7.5pt; margin: 2px 2px 2px 0; font-family: 'DM Mono', monospace; }
        .resume-doc.modern .r-main { padding: 32px 28px; }
        .resume-doc.modern .r-main-summary { font-size: 9pt; color: #555; margin-bottom: 22px; line-height: 1.7; }
        .resume-doc.modern .r-section { margin-bottom: 20px; }
        .resume-doc.modern .r-section-title { font-size: 9.5pt; font-weight: 600; color: #1a1a2e; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 2px solid #c8a96e; padding-bottom: 4px; margin-bottom: 12px; }
        .resume-doc.modern .r-entry { margin-bottom: 12px; }
        .resume-doc.modern .r-entry-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .resume-doc.modern .r-entry-title { font-weight: 600; font-size: 9.5pt; }
        .resume-doc.modern .r-entry-org { font-size: 8.5pt; color: #c8a96e; font-weight: 500; }
        .resume-doc.modern .r-entry-date { font-size: 8pt; color: #888; font-family: 'DM Mono', monospace; white-space: nowrap; }
        .resume-doc.modern .r-entry-desc { font-size: 8.5pt; color: #555; margin-top: 4px; white-space: pre-wrap; }

        /* Minimal */
        .resume-doc.minimal { padding: 52px 56px; }
        .resume-doc.minimal .r-header { margin-bottom: 28px; border-bottom: 1px solid #ddd; padding-bottom: 20px; }
        .resume-doc.minimal .r-name { font-family: 'DM Sans', sans-serif; font-size: 24pt; font-weight: 300; color: #1a1a2e; letter-spacing: -0.02em; margin-bottom: 8px; }
        .resume-doc.minimal .r-name strong { font-weight: 600; }
        .resume-doc.minimal .r-contact { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 8.5pt; color: #888; }
        .resume-doc.minimal .r-section { margin-bottom: 24px; }
        .resume-doc.minimal .r-section-title { font-size: 7.5pt; font-weight: 600; color: #999; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px; }
        .resume-doc.minimal .r-summary { font-size: 9.5pt; color: #555; }
        .resume-doc.minimal .r-entry { display: grid; grid-template-columns: 90px 1fr; gap: 0 16px; margin-bottom: 12px; }
        .resume-doc.minimal .r-entry-date { font-size: 8pt; color: #999; font-family: 'DM Mono', monospace; padding-top: 1px; }
        .resume-doc.minimal .r-entry-title { font-weight: 600; font-size: 9.5pt; }
        .resume-doc.minimal .r-entry-org { font-size: 8.5pt; color: #888; }
        .resume-doc.minimal .r-entry-desc { font-size: 8.5pt; color: #666; margin-top: 4px; white-space: pre-wrap; }
        .resume-doc.minimal .r-skills { display: flex; flex-wrap: wrap; gap: 5px; }
        .resume-doc.minimal .r-skill { border: 1px solid #ddd; padding: 2px 10px; border-radius: 2px; font-size: 8pt; color: #666; font-family: 'DM Mono', monospace; }
      `}</style>

      {/* AI Assistant Panel */}
      <div className="w-full xl:w-[320px] flex-shrink-0 overflow-y-auto pr-2 space-y-4 no-print">
        <Card className="shadow-sm border-indigo-100">
          <CardHeader className="bg-indigo-50 p-4">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {!showImport ? (
              <Button variant="outline" className="w-full" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4 mr-2" /> Import Resume
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea 
                  placeholder="Paste your resume text here..." 
                  value={importText} 
                  onChange={e => setImportText(e.target.value)}
                  className="text-xs min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleImport} disabled={isParsing}>
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Parse'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Target Job Description</Label>
              <Textarea 
                placeholder="Paste job description to get real-time ATS scoring..." 
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                className="text-xs min-h-[100px]"
              />
            </div>

            {analysis && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  onClick={handleAutoOptimize}
                  disabled={isAutoOptimizing}
                >
                  {isAutoOptimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Auto Optimize Resume
                </Button>
                <div className="text-center">
                  <div className={`text-3xl font-black ${analysis.score_after >= 80 ? 'text-emerald-600' : analysis.score_after >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {analysis.score_after}
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">ATS Score</div>
                </div>

                {analysis.rewrite_lines.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Suggested Rewrites</Label>
                    {analysis.rewrite_lines.map((line, i) => (
                      <div key={i} className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs space-y-2">
                        <div className="text-red-600 line-through">{line.before}</div>
                        <div className="text-emerald-700 font-medium">{line.after}</div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => applyRewrite(line.before, line.after)}>
                          Apply Fix
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.add_lines.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Missing Keywords</Label>
                    {analysis.add_lines.map((line, i) => (
                      <div key={i} className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs space-y-2">
                        <div className="text-indigo-900">{line.content}</div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => applyAdd(line.content)}>
                          Add to Summary
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.remove_lines.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Weak Lines to Remove</Label>
                    {analysis.remove_lines.map((line, i) => (
                      <div key={i} className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs space-y-2">
                        <div className="text-red-900 line-through">{line.content}</div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs text-red-600 hover:bg-red-100" onClick={() => applyRemove(line.content)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing changes...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor Panel */}
      <div className="w-full xl:w-[420px] flex-shrink-0 overflow-y-auto pr-2 space-y-4 no-print">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Resume Builder</h2>
          <div className="flex gap-2">
            <Button onClick={() => downloadResumeDocx(personal, work, edu, proj, skills)} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> DOCX
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        {/* Template */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('template')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Template Style</CardTitle>
              {openSections.template ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.template && (
            <CardContent className="p-4 pt-0">
              <div className="flex gap-2">
                {['classic', 'modern', 'minimal'].map(t => (
                  <Button
                    key={t}
                    variant={template === t ? 'default' : 'outline'}
                    className={`flex-1 capitalize ${template === t ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    onClick={() => setTemplate(t as TemplateType)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('personal')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Contact Info</CardTitle>
              {openSections.personal ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.personal && (
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">First Name</Label>
                  <Input name="firstName" value={personal.firstName} onChange={handlePersonalChange} placeholder="Jane" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name</Label>
                  <Input name="lastName" value={personal.lastName} onChange={handlePersonalChange} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Job Title</Label>
                <Input name="jobTitle" value={personal.jobTitle} onChange={handlePersonalChange} placeholder="Senior Product Designer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input name="email" value={personal.email} onChange={handlePersonalChange} placeholder="jane@example.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input name="phone" value={personal.phone} onChange={handlePersonalChange} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input name="location" value={personal.location} onChange={handlePersonalChange} placeholder="New York, NY" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">LinkedIn / Website</Label>
                  <Input name="website" value={personal.website} onChange={handlePersonalChange} placeholder="linkedin.com/in/jane" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Summary */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('summary')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Summary</CardTitle>
              {openSections.summary ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.summary && (
            <CardContent className="p-4 pt-0">
              <Textarea name="summary" value={personal.summary} onChange={handlePersonalChange} placeholder="A brief overview of your background..." className="min-h-[100px]" />
            </CardContent>
          )}
        </Card>

        {/* Work Experience */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('work')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Work Experience</CardTitle>
              {openSections.work ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.work && (
            <CardContent className="p-4 pt-0 space-y-4">
              {work.map((item, idx) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <button onClick={() => removeEntry('work', item.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1"><Label className="text-xs">Job Title</Label><Input value={item.title || ''} onChange={e => updateEntry('work', item.id, 'title', e.target.value)} placeholder="Senior Designer" /></div>
                    <div className="space-y-1"><Label className="text-xs">Company</Label><Input value={item.company || ''} onChange={e => updateEntry('work', item.id, 'company', e.target.value)} placeholder="Acme Corp" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input value={item.startDate || ''} onChange={e => updateEntry('work', item.id, 'startDate', e.target.value)} placeholder="Jan 2020" /></div>
                    <div className="space-y-1"><Label className="text-xs">End Date</Label><Input value={item.endDate || ''} onChange={e => updateEntry('work', item.id, 'endDate', e.target.value)} placeholder="Present" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={item.desc || ''} onChange={e => updateEntry('work', item.id, 'desc', e.target.value)} placeholder="Key responsibilities..." /></div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50" onClick={() => addEntry('work')}>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Education */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('edu')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Education</CardTitle>
              {openSections.edu ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.edu && (
            <CardContent className="p-4 pt-0 space-y-4">
              {edu.map((item, idx) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <button onClick={() => removeEntry('edu', item.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1"><Label className="text-xs">Degree</Label><Input value={item.degree || ''} onChange={e => updateEntry('edu', item.id, 'degree', e.target.value)} placeholder="B.Sc. Computer Science" /></div>
                    <div className="space-y-1"><Label className="text-xs">School</Label><Input value={item.school || ''} onChange={e => updateEntry('edu', item.id, 'school', e.target.value)} placeholder="MIT" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1"><Label className="text-xs">Start Year</Label><Input value={item.startDate || ''} onChange={e => updateEntry('edu', item.id, 'startDate', e.target.value)} placeholder="2016" /></div>
                    <div className="space-y-1"><Label className="text-xs">End Year</Label><Input value={item.endDate || ''} onChange={e => updateEntry('edu', item.id, 'endDate', e.target.value)} placeholder="2020" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea value={item.desc || ''} onChange={e => updateEntry('edu', item.id, 'desc', e.target.value)} placeholder="GPA, Awards..." /></div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50" onClick={() => addEntry('edu')}>
                <Plus className="w-4 h-4 mr-2" /> Add Education
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Projects */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('proj')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Projects</CardTitle>
              {openSections.proj ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.proj && (
            <CardContent className="p-4 pt-0 space-y-4">
              {proj.map((item, idx) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <button onClick={() => removeEntry('proj', item.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1"><Label className="text-xs">Project Name</Label><Input value={item.title || ''} onChange={e => updateEntry('proj', item.id, 'title', e.target.value)} placeholder="Portfolio" /></div>
                    <div className="space-y-1"><Label className="text-xs">Technologies</Label><Input value={item.tech || ''} onChange={e => updateEntry('proj', item.id, 'tech', e.target.value)} placeholder="React, Node" /></div>
                  </div>
                  <div className="space-y-1 mb-3"><Label className="text-xs">URL</Label><Input value={item.url || ''} onChange={e => updateEntry('proj', item.id, 'url', e.target.value)} placeholder="github.com/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={item.desc || ''} onChange={e => updateEntry('proj', item.id, 'desc', e.target.value)} placeholder="What did you build?" /></div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50" onClick={() => addEntry('proj')}>
                <Plus className="w-4 h-4 mr-2" /> Add Project
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Skills */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection('skills')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-700">Skills</CardTitle>
              {openSections.skills ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>
          </CardHeader>
          {openSections.skills && (
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="flex gap-2">
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="e.g. React, Python" />
                <Button onClick={addSkill} className="bg-indigo-600 hover:bg-indigo-700">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <div key={s} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-indigo-600"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-gray-200 overflow-y-auto p-8 flex flex-col items-center rounded-xl shadow-inner relative">
        <div className="flex gap-2 mb-4 no-print">
          <Button variant={viewMode === 'edit' ? 'default' : 'outline'} onClick={() => setViewMode('edit')}>
            <LayoutTemplate className="w-4 h-4 mr-2" /> Edit Mode
          </Button>
          <Button variant={viewMode === 'heatmap' ? 'default' : 'outline'} onClick={handleGenerateHeatmap} disabled={isGeneratingHeatmap}>
            {isGeneratingHeatmap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Heatmap Mode
          </Button>
        </div>

        {viewMode === 'heatmap' ? (
          <div className="resume-doc p-8 space-y-2 bg-white w-[210mm] min-h-[297mm] shadow-md">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Recruiter Readability Heatmap</h2>
            {heatmapData.map((line, i) => (
              <div key={i} className={`p-2 rounded ${line.color === 'green' ? 'bg-green-100 text-green-900 border-l-4 border-green-500' : line.color === 'yellow' ? 'bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500' : 'bg-red-100 text-red-900 border-l-4 border-red-500'}`}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm">{line.text}</span>
                  <span className="font-bold text-xs px-2 py-1 bg-white/50 rounded">{line.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div id="resume-preview" className={`resume-doc ${template}`}>
            {template === 'classic' && (
            <>
              <div className="r-header">
                <div className="r-name">{personal.firstName || 'First'} {personal.lastName || 'Last'}</div>
                {personal.jobTitle && <div style={{ color: '#c8a96e', fontSize: '11pt', marginTop: '4px', fontWeight: 300 }}>{personal.jobTitle}</div>}
                <div className="r-contact">
                  {personal.email && <span>✉ {personal.email}</span>}
                  {personal.phone && <span>✆ {personal.phone}</span>}
                  {personal.location && <span>⌖ {personal.location}</span>}
                  {personal.website && <span>⊕ {personal.website}</span>}
                </div>
              </div>
              <div className="r-body">
                {personal.summary && (
                  <div className="r-section">
                    <div className="r-section-title">Profile</div>
                    <div className="r-summary">{personal.summary}</div>
                  </div>
                )}
                {work.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Experience</div>
                    {work.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.title || 'Untitled'}</div>
                            {e.company && <div className="r-entry-org">{e.company}</div>}
                          </div>
                          {(e.startDate || e.endDate) && <div className="r-entry-date">{e.startDate} {e.startDate && e.endDate ? '–' : ''} {e.endDate}</div>}
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {edu.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Education</div>
                    {edu.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.degree || 'Untitled'}</div>
                            {e.school && <div className="r-entry-org">{e.school}</div>}
                          </div>
                          {(e.startDate || e.endDate) && <div className="r-entry-date">{e.startDate} {e.startDate && e.endDate ? '–' : ''} {e.endDate}</div>}
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {proj.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Projects</div>
                    {proj.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.title || 'Untitled'}</div>
                            {e.tech && <div className="r-entry-org">{e.tech}</div>}
                          </div>
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {skills.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Skills</div>
                    <div className="r-skills">
                      {skills.map(s => <span key={s} className="r-skill">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {template === 'modern' && (
            <>
              <div className="r-sidebar">
                <div className="r-sidebar-name">{personal.firstName || 'First'}<br/>{personal.lastName || 'Last'}</div>
                {personal.jobTitle && <div style={{ color: '#999', fontSize: '8pt', marginBottom: '18px', fontWeight: 300, fontStyle: 'italic' }}>{personal.jobTitle}</div>}
                {(personal.email || personal.phone || personal.location || personal.website) && (
                  <div className="r-sidebar-section">
                    <div className="r-sidebar-title">Contact</div>
                    {personal.email && <div className="r-sidebar-item">✉ {personal.email}</div>}
                    {personal.phone && <div className="r-sidebar-item">✆ {personal.phone}</div>}
                    {personal.location && <div className="r-sidebar-item">⌖ {personal.location}</div>}
                    {personal.website && <div className="r-sidebar-item">⊕ {personal.website}</div>}
                  </div>
                )}
                {skills.length > 0 && (
                  <div className="r-sidebar-section">
                    <div className="r-sidebar-title">Skills</div>
                    {skills.map(s => <span key={s} className="r-sidebar-skill">{s}</span>)}
                  </div>
                )}
              </div>
              <div className="r-main">
                {personal.summary && <div className="r-main-summary">{personal.summary}</div>}
                {work.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Experience</div>
                    {work.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.title || 'Untitled'}</div>
                            {e.company && <div className="r-entry-org">{e.company}</div>}
                          </div>
                          {(e.startDate || e.endDate) && <div className="r-entry-date">{e.startDate} {e.startDate && e.endDate ? '–' : ''} {e.endDate}</div>}
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {edu.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Education</div>
                    {edu.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.degree || 'Untitled'}</div>
                            {e.school && <div className="r-entry-org">{e.school}</div>}
                          </div>
                          {(e.startDate || e.endDate) && <div className="r-entry-date">{e.startDate} {e.startDate && e.endDate ? '–' : ''} {e.endDate}</div>}
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {proj.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Projects</div>
                    {proj.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-top">
                          <div>
                            <div className="r-entry-title">{e.title || 'Untitled'}</div>
                            {e.tech && <div className="r-entry-org">{e.tech}</div>}
                          </div>
                        </div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {template === 'minimal' && (
            <>
              <div className="r-header">
                <div className="r-name">{personal.firstName || 'First'} <strong>{personal.lastName || 'Last'}</strong></div>
                {personal.jobTitle && <div style={{ color: '#888', fontSize: '9.5pt', marginBottom: '8px', fontWeight: 300 }}>{personal.jobTitle}</div>}
                <div className="r-contact">
                  {personal.email && <span>{personal.email}</span>}
                  {personal.phone && <span>{personal.phone}</span>}
                  {personal.location && <span>{personal.location}</span>}
                  {personal.website && <span>{personal.website}</span>}
                </div>
              </div>
              <div className="r-body">
                {personal.summary && (
                  <div className="r-section">
                    <div className="r-section-title">About</div>
                    <div className="r-summary">{personal.summary}</div>
                  </div>
                )}
                {work.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Experience</div>
                    {work.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-date">{(e.startDate || e.endDate) ? `${e.startDate || ''}${e.startDate && e.endDate ? '–' : ''}${e.endDate || ''}` : ''}</div>
                        <div className="r-entry-content">
                          <div className="r-entry-title">{e.title || 'Untitled'}</div>
                          {e.company && <div className="r-entry-org">{e.company}</div>}
                          {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {edu.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Education</div>
                    {edu.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-date">{(e.startDate || e.endDate) ? `${e.startDate || ''}${e.startDate && e.endDate ? '–' : ''}${e.endDate || ''}` : ''}</div>
                        <div className="r-entry-content">
                          <div className="r-entry-title">{e.degree || 'Untitled'}</div>
                          {e.school && <div className="r-entry-org">{e.school}</div>}
                          {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {proj.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Projects</div>
                    {proj.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-date"></div>
                        <div className="r-entry-content">
                          <div className="r-entry-title">{e.title || 'Untitled'}</div>
                          {e.tech && <div className="r-entry-org">{e.tech}</div>}
                          {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {skills.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">Skills</div>
                    <div className="r-skills">
                      {skills.map(s => <span key={s} className="r-skill">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
