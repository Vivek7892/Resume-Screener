interface Props {
  skills: string[];
  variant?: "match" | "missing" | "neutral";
}

const variantClass: Record<string, string> = {
  match: "bg-green-100 text-green-700 border-green-200",
  missing: "bg-red-100 text-red-600 border-red-200",
  neutral: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function SkillBadges({ skills, variant = "neutral" }: Props) {
  if (!skills?.length) return <span className="text-xs text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => (
        <span
          key={s}
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${variantClass[variant]}`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
