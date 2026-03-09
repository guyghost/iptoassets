export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function computeHealthScore(granted: number, total: number, abandoned: number): number {
  const nonAbandoned = total - abandoned;
  if (nonAbandoned === 0) return 0;
  return Math.round((granted / nonAbandoned) * 100);
}

export function healthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Attention";
  return "At Risk";
}
