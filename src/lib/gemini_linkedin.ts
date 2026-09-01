export async function extractLinkedInProfile(content: string, isBase64Pdf: boolean = false) {
  const prompt = `Extract the LinkedIn profile information into a structured JSON format.
  Include headline, about, location, current_title, current_company, experiences, education, skills, certifications, and projects.`;

  const requestContents = isBase64Pdf
    ? [
        {
          inlineData: {
            data: content,
            mimeType: "application/pdf",
          },
        },
        prompt,
      ]
    : [prompt, "\n\nPROFILE CONTENT:\n" + content];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: requestContents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          about: { type: Type.STRING },
          location: { type: Type.STRING },
          current_title: { type: Type.STRING },
          current_company: { type: Type.STRING },
          experiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                date_range: { type: Type.STRING },
                description: { type: Type.STRING },
              },
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                school: { type: Type.STRING },
                degree: { type: Type.STRING },
                date_range: { type: Type.STRING },
              },
            },
          },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          projects: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function generateLinkedInAudit(profileData: any) {
  const prompt = `You are an expert technical recruiter and career coach. Audit this LinkedIn profile data.
  Provide an overall score out of 100, plus category scores (headline, about, experience, skills, keywords, completeness).
  Identify strengths, weaknesses, and actionable recommendations.
  Provide rewritten sections for any weak areas (headline, about, or specific experience bullets) to improve recruiter visibility.
  
  PROFILE DATA:
  ${JSON.stringify(profileData, null, 2)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          total_score: { type: Type.NUMBER },
          headline_score: { type: Type.NUMBER },
          about_score: { type: Type.NUMBER },
          experience_score: { type: Type.NUMBER },
          skills_score: { type: Type.NUMBER },
          keywords_score: { type: Type.NUMBER },
          completeness_score: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          rewrites: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                current: { type: Type.STRING },
                recommended: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
