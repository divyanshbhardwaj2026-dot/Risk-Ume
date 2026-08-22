import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ATSAnalysis } from '@/lib/gemini';

export const downloadResumeDocx = async (personal: any, work: any[], edu: any[], proj: any[], skills: string[]) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `${personal.firstName || ''} ${personal.lastName || ''}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `${personal.email || ''} | ${personal.phone || ''} | ${personal.location || ''} | ${personal.website || ''}`,
          }),
          new Paragraph({ text: "" }),
          
          ...(personal.summary ? [
            new Paragraph({ text: "SUMMARY", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: personal.summary }),
            new Paragraph({ text: "" }),
          ] : []),

          ...(work.length > 0 ? [
            new Paragraph({ text: "EXPERIENCE", heading: HeadingLevel.HEADING_2 }),
            ...work.flatMap(w => [
              new Paragraph({
                children: [
                  new TextRun({ text: w.title, bold: true }),
                  new TextRun({ text: ` at ${w.company}`, italics: true }),
                  new TextRun({ text: ` | ${w.startDate} - ${w.endDate}` }),
                ]
              }),
              new Paragraph({ text: w.desc }),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(edu.length > 0 ? [
            new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2 }),
            ...edu.flatMap(e => [
              new Paragraph({
                children: [
                  new TextRun({ text: e.degree, bold: true }),
                  new TextRun({ text: ` at ${e.school}`, italics: true }),
                  new TextRun({ text: ` | ${e.startDate} - ${e.endDate}` }),
                ]
              }),
              new Paragraph({ text: e.desc }),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(proj.length > 0 ? [
            new Paragraph({ text: "PROJECTS", heading: HeadingLevel.HEADING_2 }),
            ...proj.flatMap(p => [
              new Paragraph({
                children: [
                  new TextRun({ text: p.title, bold: true }),
                  new TextRun({ text: ` | ${p.tech}`, italics: true }),
                ]
              }),
              new Paragraph({ text: p.desc }),
              new Paragraph({ text: "" }),
            ])
          ] : []),

          ...(skills.length > 0 ? [
            new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: skills.join(", ") }),
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${personal.firstName || 'My'}_Resume.docx`);
};

export const generateOptimizedResume = async (originalText: string, analysis: ATSAnalysis) => {
  // This is a simplified version. In a real app, you'd want to parse the original text
  // and intelligently insert/replace the lines. For now, we'll append the suggestions
  // or create a new structured document based on the analysis.

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Optimized Resume Suggestions",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Based on ATS Analysis",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: "" }), // Spacer
          
          new Paragraph({
            text: "Original Resume Text:",
            heading: HeadingLevel.HEADING_3,
          }),
          ...originalText.split('\n').map(line => new Paragraph({ text: line })),
          
          new Paragraph({ text: "" }), // Spacer
          new Paragraph({
            text: "--- AI OPTIMIZATIONS ---",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: "" }), // Spacer

          new Paragraph({
            text: "Lines to Add:",
            heading: HeadingLevel.HEADING_3,
          }),
          ...analysis.add_lines.map(item => new Paragraph({
            children: [
              new TextRun({ text: "• " + item.content, bold: true }),
              new TextRun({ text: ` (Reason: ${item.reason})`, italics: true }),
            ]
          })),

          new Paragraph({ text: "" }), // Spacer
          new Paragraph({
            text: "Lines to Rewrite:",
            heading: HeadingLevel.HEADING_3,
          }),
          ...analysis.rewrite_lines.map(item => new Paragraph({
            children: [
              new TextRun({ text: "Before: ", color: "FF0000" }),
              new TextRun({ text: item.before, strike: true }),
              new TextRun({ text: "\nAfter: ", color: "008000" }),
              new TextRun({ text: item.after, bold: true }),
              new TextRun({ text: `\nReason: ${item.reason}`, italics: true }),
            ]
          })),

          new Paragraph({ text: "" }), // Spacer
          new Paragraph({
            text: "Lines to Remove:",
            heading: HeadingLevel.HEADING_3,
          }),
          ...analysis.remove_lines.map(item => new Paragraph({
            children: [
              new TextRun({ text: "• " + item.content, strike: true, color: "FF0000" }),
              new TextRun({ text: ` (Reason: ${item.reason})`, italics: true }),
            ]
          })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Optimized_Resume.docx");
};
