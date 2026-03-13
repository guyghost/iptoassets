import type { ScoreBreakdown } from "./entities.js";

export interface RenewalScoreInput {
  readonly renewalCost: number;
  readonly portfolioAvgCost: number;
  readonly citingPatentsCount: number;
  readonly jurisdictionCount: number;
  readonly patentAgeYears: number;
  readonly maxPatentAge: number;
}

export function computeRenewalScore(params: RenewalScoreInput): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const costScore = computeCostScore(params.renewalCost, params.portfolioAvgCost);
  const citationScore = computeCitationScore(params.citingPatentsCount);
  const coverageScore = computeCoverageScore(params.jurisdictionCount);
  const ageScore = computeAgeScore(params.patentAgeYears, params.maxPatentAge);

  const breakdown: ScoreBreakdown = { costScore, citationScore, coverageScore, ageScore };
  const score = costScore + citationScore + coverageScore + ageScore;

  return { score, breakdown };
}

function computeCostScore(cost: number, avgCost: number): number {
  if (avgCost <= 0) return 13;
  const ratio = cost / avgCost;
  const raw = 25 * (1 - Math.min(ratio, 2) / 2);
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeCitationScore(count: number): number {
  const raw = 25 * Math.min(count, 10) / 10;
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeCoverageScore(jurisdictionCount: number): number {
  const raw = 25 * Math.min(jurisdictionCount, 8) / 8;
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeAgeScore(ageYears: number, maxAge: number): number {
  if (maxAge <= 0) return 13;
  const remainingLife = Math.max(0, maxAge - ageYears);
  const raw = 25 * remainingLife / maxAge;
  return Math.round(Math.max(0, Math.min(25, raw)));
}
