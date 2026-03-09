import type { PortfolioMetrics, DeadlineMetrics } from "@ipms/domain";

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const res = await fetch("/api/analytics/portfolio");
  return res.json();
}

export async function fetchDeadlineMetrics(): Promise<DeadlineMetrics> {
  const res = await fetch("/api/analytics/deadlines");
  return res.json();
}
