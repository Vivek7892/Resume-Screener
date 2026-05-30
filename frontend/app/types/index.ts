// Shared TypeScript types for the application

export interface Candidate {
  id: number;
  session_id: string;
  name: string;
  filename: string;
  skills: string[];
  education: string[];
  experience: string[];
  keywords: string[];
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  rank: number;
  created_at: string;
  // breakdown scores (returned from /analyze)
  skills_score?: number;
  semantic_score?: number;
  experience_score?: number;
  education_score?: number;
  keyword_score?: number;  // alias for semantic_score
}

export interface AnalyzeRequest {
  jd_text?: string;
  jd_file_path?: string;
  resume_paths: string[];
}

export interface AnalyzeResponse {
  session_id: string;
  total: number;
  candidates: Candidate[];
}

export interface UploadedFile {
  original_name: string;
  saved_path: string;
}

export interface UploadResponse {
  message: string;
  files: UploadedFile[];
}
