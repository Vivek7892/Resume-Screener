import axios from "axios";
import { UploadResponse, AnalyzeResponse, Candidate } from "@/app/types";

// Always use /api in the browser — the catch-all route handler at
// app/api/[...path]/route.ts streams requests to FastAPI with no size limit.
// In production set NEXT_PUBLIC_API_URL to your backend URL directly.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({ baseURL: BASE_URL });

export async function uploadResumes(files: File[]): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post<UploadResponse>("/upload-resumes", form);
  return data;
}

export async function uploadJD(file: File): Promise<{ saved_path: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/upload-jd", form);
  return data;
}

export async function analyzeResumes(payload: {
  jd_text?: string;
  jd_file_path?: string;
  resume_paths: string[];
}): Promise<AnalyzeResponse> {
  const { data } = await api.post<AnalyzeResponse>("/analyze", payload);
  return data;
}

export async function getResults(params?: {
  session_id?: string;
  search?: string;
  sort_by?: string;
}): Promise<{ total: number; candidates: Candidate[] }> {
  const { data } = await api.get("/results", { params });
  return data;
}

export function exportCSV(session_id?: string) {
  // Build URL relative to current origin so it goes through the proxy
  const base = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : `${window.location.origin}/api`;
  const url = new URL(`${base}/results/export`);
  if (session_id) url.searchParams.set("session_id", session_id);
  window.open(url.toString(), "_blank");
}
