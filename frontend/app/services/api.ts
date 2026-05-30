import axios from "axios";
import { UploadResponse, AnalyzeResponse, Candidate } from "@/app/types";

// In production (Render), NEXT_PUBLIC_API_URL points directly to the backend.
// In dev, Next.js rewrites /api/* → localhost:8000/* via next.config.mjs.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "/api";

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
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const url = new URL(`${base}/results/export`, window.location.origin);
  if (session_id) url.searchParams.set("session_id", session_id);
  window.open(url.toString(), "_blank");
}
