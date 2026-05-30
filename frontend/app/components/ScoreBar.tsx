interface Props {
  score: number;
  showLabel?: boolean;
}

function scoreGradient(pct: number) {
  if (pct >= 75) return "from-emerald-400 to-emerald-500";
  if (pct >= 50) return "from-blue-400 to-blue-500";
  if (pct >= 30) return "from-amber-400 to-amber-500";
  return "from-red-400 to-red-500";
}

export default function ScoreBar({ score, showLabel = false }: Props) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Match</span>
          <span className="font-medium">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${scoreGradient(pct)} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
