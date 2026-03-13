import { describe, it, expect } from "vitest";
import { computeRenewalScore } from "./renewal-score.js";

describe("computeRenewalScore", () => {
  const baseParams = {
    renewalCost: 1000,
    portfolioAvgCost: 1000,
    citingPatentsCount: 5,
    jurisdictionCount: 3,
    patentAgeYears: 10,
    maxPatentAge: 20,
  };

  it("returns a score between 0 and 100", () => {
    const result = computeRenewalScore(baseParams);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns a breakdown with four components summing to the score", () => {
    const result = computeRenewalScore(baseParams);
    const { costScore, citationScore, coverageScore, ageScore } = result.breakdown;
    expect(costScore + citationScore + coverageScore + ageScore).toBe(result.score);
  });

  it("each component is between 0 and 25", () => {
    const result = computeRenewalScore(baseParams);
    const { costScore, citationScore, coverageScore, ageScore } = result.breakdown;
    for (const s of [costScore, citationScore, coverageScore, ageScore]) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(25);
    }
  });

  it("gives higher costScore when cost is below average", () => {
    const cheap = computeRenewalScore({ ...baseParams, renewalCost: 200 });
    const expensive = computeRenewalScore({ ...baseParams, renewalCost: 3000 });
    expect(cheap.breakdown.costScore).toBeGreaterThan(expensive.breakdown.costScore);
  });

  it("gives higher citationScore with more citations", () => {
    const many = computeRenewalScore({ ...baseParams, citingPatentsCount: 20 });
    const few = computeRenewalScore({ ...baseParams, citingPatentsCount: 0 });
    expect(many.breakdown.citationScore).toBeGreaterThan(few.breakdown.citationScore);
  });

  it("gives higher coverageScore with more jurisdictions", () => {
    const wide = computeRenewalScore({ ...baseParams, jurisdictionCount: 10 });
    const narrow = computeRenewalScore({ ...baseParams, jurisdictionCount: 1 });
    expect(wide.breakdown.coverageScore).toBeGreaterThan(narrow.breakdown.coverageScore);
  });

  it("gives higher ageScore to younger patents", () => {
    const young = computeRenewalScore({ ...baseParams, patentAgeYears: 2 });
    const old = computeRenewalScore({ ...baseParams, patentAgeYears: 19 });
    expect(young.breakdown.ageScore).toBeGreaterThan(old.breakdown.ageScore);
  });

  it("handles zero portfolioAvgCost gracefully", () => {
    const result = computeRenewalScore({ ...baseParams, portfolioAvgCost: 0 });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles zero maxPatentAge gracefully", () => {
    const result = computeRenewalScore({ ...baseParams, maxPatentAge: 0 });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
