"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DropZone from "@/app/components/DropZone";
import Spinner from "@/app/components/Spinner";
import { uploadResumes, uploadJD, analyzeResumes } from "@/app/services/api";
import axios from "axios";
import { FileText, Briefcase, Zap, AlertCircle, CheckCircle, Users, BarChart3 } from "lucide-react";

type JDMode = "paste" | "upload";

const features = [
  { icon: Users, label: "Batch Upload", desc: "Process dozens of CVs at once" },
  { icon: BarChart3, label: "AI Scoring", desc: "Skills, semantics & experience" },
  { icon: Zap, label: "Instant Ranks", desc: "Results in seconds, export CSV" },
];

export default function HomePage() {
  const router = useRouter();
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [jdMode, setJdMode] = useState<JDMode>("paste");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAnalyze =
    resumeFiles.length > 0 && (jdText.trim().length > 20 || jdFile.length > 0);

  async function handleAnalyze() {
    setError("");
    setLoading(true);
    try {
      const resumeUpload = await uploadResumes(resumeFiles);
      const resumePaths = resumeUpload.files.map((f) => f.saved_path);

      let jdFilePath: string | undefined;
      let jdContent: string | undefined;
      if (jdMode === "upload" && jdFile.length > 0) {
        const jdUpload = await uploadJD(jdFile[0]);
        jdFilePath = jdUpload.saved_path;
      } else {
        jdContent = jdText;
      }

      const result = await analyzeResumes({
        jd_text: jdContent,
        jd_file_path: jdFilePath,
        resume_paths: resumePaths,
      });

      router.push(`/dashboard?session_id=${result.session_id}`);
    } catch (err: unknown) {
      let msg = "Analysis failed. Is the backend running?";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        // detail may be a string or an array of validation errors
        if (typeof detail === "string") msg = detail;
        else if (Array.isArray(detail)) msg = detail.map((d: {msg:string}) => d.msg).join(", ");
        else msg = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner text="Analyzing resumes with AI…" />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/30">
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Briefcase size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
            ResumeRank <span className="gradient-text">AI</span>
          </span>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full hidden sm:block">
          HR Screening Tool
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 sm:mb-5">
            <Zap size={11} /> AI-Powered Candidate Screening
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 leading-tight tracking-tight px-2">
            Find the <span className="gradient-text">Best Candidates</span><br className="hidden sm:block" /> in Seconds
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed px-2">
            Upload resumes, paste a job description, and get instant AI-ranked results with skill gap analysis.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-left">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Resume Upload */}
          <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={15} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 text-sm">Upload Resumes</h2>
                <p className="text-xs text-gray-400">PDF, DOC, DOCX supported</p>
              </div>
              {resumeFiles.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">
                  <CheckCircle size={10} /> {resumeFiles.length}
                </span>
              )}
            </div>
            <DropZone
              label="Drag & drop resumes, or tap to browse"
              multiple
              onFilesSelected={setResumeFiles}
              selectedFiles={resumeFiles}
            />
          </div>

          {/* JD Input */}
          <div className="card p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                <Briefcase size={15} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">Job Description</h2>
                <p className="text-xs text-gray-400">Paste text or upload a file</p>
              </div>
            </div>

            <div className="flex rounded-xl bg-gray-100 p-1 mb-4 text-sm">
              {(["paste", "upload"] as JDMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setJdMode(m)}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all text-xs ${
                    jdMode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "paste" ? "Paste Text" : "Upload File"}
                </button>
              ))}
            </div>

            {jdMode === "paste" ? (
              <textarea
                className="w-full h-40 sm:h-44 border border-gray-200 rounded-xl p-3 sm:p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder:text-gray-400 transition-all"
                placeholder="Paste the job description here…"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            ) : (
              <DropZone
                label="Upload JD document"
                multiple={false}
                onFilesSelected={setJdFile}
                selectedFiles={jdFile}
              />
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Analyze Button */}
        <div className="mt-8 sm:mt-10 text-center">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 sm:px-12 py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none w-full sm:w-auto"
          >
            <Zap size={17} />
            Analyze & Rank Candidates
          </button>
          {!canAnalyze && (
            <p className="text-xs text-gray-400 mt-3">
              Add at least one resume and a job description to continue.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
