/** Returns Tailwind color class based on score 0-100 */
export function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

export function scoreBg(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Weak Match";
}
