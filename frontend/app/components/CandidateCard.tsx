"use client";
import { useState } from "react";
import { Candidate } from "@/app/types";
import { scoreColor, scoreLabel } from "@/app/utils/score";
import ScoreBar from "./ScoreBar";
import SkillBadges from "./SkillBadges";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  candidate: Candidate;
}

const rankStyles: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-amber-50 border-amber-200", text: "text-amber-500", label: "🥇" },
  2: { bg: "bg-slate-50 border-slate-200", text: "text-slate-400", label: "🥈" },
  3: { bg: "bg-orange-50 border-orange-200", text: "text-orange-400", label: "🥉" },
};

const avatarColors = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CandidateCard({ candidate: c }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rank = rankStyles[c.rank];
  const avatarColor = avatarColors[(c.rank - 1) % avatarColors.length];

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${rank ? rank.bg : "border-gray-100"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Avatar */}
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center shrink-0 shadow-md`}>
          <span className="text-white text-xs sm:text-sm font-extrabold tracking-wide">
            {getInitials(c.name)}
          </span>
        </div>

        {/* Name — lead element */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
              {c.name}
            </p>
            {rank && <span className="text-base leading-none">{rank.label}</span>}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{c.filename}</p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <p className={`text-xl sm:text-2xl font-extrabold tabular-nums ${scoreColor(c.match_score)}`}>
            {c.match_score.toFixed(1)}<span className="text-xs sm:text-sm font-medium">%</span>
          </p>
          <p className="text-xs text-gray-400 hidden sm:block">{scoreLabel(c.match_score)}</p>
        </div>

        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 ${rank ? rank.bg : "bg-gray-50 border-gray-200"}`}>
          <span className={`text-xs font-extrabold ${rank ? rank.text : "text-gray-400"}`}>
            #{c.rank}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Score bar */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <ScoreBar score={c.match_score} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 sm:px-4 py-4 sm:py-5 space-y-4 sm:space-y-5 bg-gray-50/50">
          {/* Score breakdown */}
          {c.skills_score !== undefined && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Score Breakdown
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { label: "Skills Match", weight: "40%", val: c.skills_score },
                  { label: "Semantic Fit", weight: "35%", val: c.semantic_score ?? c.keyword_score },
                  { label: "Experience", weight: "15%", val: c.experience_score },
                  { label: "Education", weight: "10%", val: c.education_score },
                ].map(({ label, weight, val }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-400">
                        {weight} · <span className="font-semibold text-gray-600">{(val ?? 0).toFixed(1)}%</span>
                      </span>
                    </div>
                    <ScoreBar score={val ?? 0} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-green-100 p-3">
              <p className="text-xs font-semibold text-green-700 mb-2">✅ Matching Skills</p>
              <SkillBadges skills={c.matching_skills} variant="match" />
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-3">
              <p className="text-xs font-semibold text-red-600 mb-2">❌ Missing Skills</p>
              <SkillBadges skills={c.missing_skills} variant="missing" />
            </div>
          </div>

          {c.education?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">🎓 Education</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {c.education.map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
