"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getResults, exportCSV } from "@/app/services/api";
import { Candidate } from "@/app/types";
import CandidateCard from "@/app/components/CandidateCard";
import ResultsTable from "@/app/components/ResultsTable";
import Spinner from "@/app/components/Spinner";
import {
  Briefcase, Download, LayoutGrid, Table2,
  ArrowLeft, Search, Users, TrendingUp, Award,
} from "lucide-react";

type ViewMode = "cards" | "table";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id") ?? undefined;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("cards");

  useEffect(() => {
    async function load() {
      try {
        const res = await getResults({ session_id: sessionId, search: search || undefined });
        setCandidates(res.candidates);
      } catch {
        setError("Failed to load results. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, search]);

  if (loading) return <Spinner text="Loading results…" />;

  if (error) return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="card px-6 sm:px-8 py-6 text-center max-w-md w-full">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">⚠</span>
        </div>
        <p className="font-semibold text-gray-800 mb-1">Connection Error</p>
        <p className="text-sm text-gray-500">{error}</p>
        <p className="mt-2 text-xs text-gray-400">Check that the backend is running on port 8000.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-sm text-blue-600 hover:underline">
          ← Go back home
        </button>
      </div>
    </main>
  );

  const topScore = candidates[0]?.match_score ?? 0;
  const avgScore = candidates.length
    ? candidates.reduce((s, c) => s + c.match_score, 0) / candidates.length
    : 0;

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
        <button
          onClick={() => router.push("/")}
          className="ml-auto flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={14} /> New Analysis
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        {/* Page title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Candidate Rankings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            AI-powered match scores based on skills, experience &amp; education
          </p>
        </div>

        {/* Stats bar */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {[
              { icon: Users, label: "Candidates", value: candidates.length, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Award, label: "Top Score", value: `${topScore.toFixed(1)}%`, color: "text-violet-600", bg: "bg-violet-50" },
              { icon: TrendingUp, label: "Avg Score", value: `${avgScore.toFixed(1)}%`, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
                  <p className={`text-base sm:text-xl font-bold ${color} tabular-nums`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <p className="text-sm text-gray-500 font-medium">
            {candidates.length} result{candidates.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent w-full sm:w-44 bg-white"
              />
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl bg-gray-100 p-1 shrink-0">
              {(["cards", "table"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`p-1.5 rounded-lg transition-all ${
                    view === v ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                  title={v === "cards" ? "Card view" : "Table view"}
                >
                  {v === "cards" ? <LayoutGrid size={15} /> : <Table2 size={15} />}
                </button>
              ))}
            </div>

            {/* Export */}
            <button
              onClick={() => exportCSV(sessionId)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span> CSV
            </button>
          </div>
        </div>

        {/* Empty state */}
        {candidates.length === 0 && (
          <div className="card text-center py-16 sm:py-20 text-gray-400 px-4">
            <Users size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-base font-medium text-gray-500">No candidates found.</p>
            <p className="text-sm mt-1">Try a new analysis from the home page.</p>
            <button onClick={() => router.push("/")} className="mt-4 text-sm text-blue-600 hover:underline">
              ← Start new analysis
            </button>
          </div>
        )}

        {/* Results */}
        {candidates.length > 0 && (
          view === "cards" ? (
            <div className="space-y-3">
              {candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
            </div>
          ) : (
            <ResultsTable candidates={candidates} />
          )
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner text="Loading…" />}>
      <DashboardContent />
    </Suspense>
  );
}
