"use client";
import { Candidate } from "@/app/types";
import { scoreColor } from "@/app/utils/score";
import ScoreBar from "./ScoreBar";
import SkillBadges from "./SkillBadges";

interface Props {
  candidates: Candidate[];
}

const rankEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function ResultsTable({ candidates }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white -mx-4 sm:mx-0">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Rank", "Candidate", "Score", "Match", "Matching Skills", "Missing Skills"].map((h) => (
              <th
                key={h}
                className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span className="text-base">{rankEmoji[c.rank] ?? ""}</span>
                  <span className="text-xs font-bold text-gray-400">#{c.rank}</span>
                </div>
              </td>
              <td className="px-3 sm:px-4 py-3 min-w-[140px]">
                {/* Name is the lead element */}
                <p className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight leading-tight whitespace-nowrap">
                  {c.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{c.filename}</p>
              </td>
              <td className={`px-3 sm:px-4 py-3 font-extrabold text-base sm:text-lg tabular-nums whitespace-nowrap ${scoreColor(c.match_score)}`}>
                {c.match_score.toFixed(1)}<span className="text-xs font-medium">%</span>
              </td>
              <td className="px-3 sm:px-4 py-3 w-28 sm:w-36">
                <ScoreBar score={c.match_score} />
              </td>
              <td className="px-3 sm:px-4 py-3 max-w-[180px]">
                <SkillBadges skills={c.matching_skills?.slice(0, 4)} variant="match" />
              </td>
              <td className="px-3 sm:px-4 py-3 max-w-[180px]">
                <SkillBadges skills={c.missing_skills?.slice(0, 4)} variant="missing" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
