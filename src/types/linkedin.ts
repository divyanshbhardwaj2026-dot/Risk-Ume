export interface LinkedInExperience {
  title: string;
  company: string;
  date_range: string;
  description: string;
}

export interface LinkedInEducation {
  school: string;
  degree: string;
  date_range: string;
}

export interface LinkedInProfile {
  id: string;
  user_id: string;
  import_id: string;
  headline: string;
  about: string;
  location: string;
  current_title: string;
  current_company: string;
  experiences: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  certifications: string[];
  projects: string[];
  raw_text: string;
  source: 'pdf' | 'paste';
  created_at: string;
  updated_at: string;
}

export interface LinkedInImport {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  status: 'queued' | 'uploading' | 'uploaded' | 'extracting' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  source: 'pdf' | 'paste';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedInRewrite {
  section: string;
  current: string;
  recommended: string;
}

export interface LinkedInAudit {
  id: string;
  user_id: string;
  import_id: string;
  profile_id: string;
  total_score: number;
  headline_score: number;
  about_score: number;
  experience_score: number;
  skills_score: number;
  keywords_score: number;
  completeness_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  rewrites: LinkedInRewrite[];
  consistency_score: number;
  consistency_issues: string[];
  created_at: string;
}

export interface ProfileSyncResult {
  field: string;
  linkedin_value: string;
  career_value: string;
  conflict: boolean;
}
