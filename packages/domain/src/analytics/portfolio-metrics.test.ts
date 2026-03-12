import { describe, it, expect } from "vitest";
import { computePortfolioMetrics } from "./portfolio-metrics.js";
import type { IPAsset } from "../entities.js";
import type { AssetId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "a0000000-0000-0000-0000-000000000001" as AssetId,
  title: "Test",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "draft",
  filingDate: null,
  expirationDate: null,
  owner: "Owner",
  organizationId: ORG_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

describe("computePortfolioMetrics", () => {
  it("returns zero counts for empty array", () => {
    const metrics = computePortfolioMetrics([], new Date("2026-03-09"));
    expect(metrics.totalAssets).toBe(0);
    expect(metrics.byStatus.draft).toBe(0);
    expect(metrics.byType.patent).toBe(0);
    expect(metrics.byJurisdiction).toEqual([]);
    expect(metrics.expiringWithin90Days).toBe(0);
  });

  it("counts assets by status", () => {
    const assets = [
      makeAsset({ status: "draft" }),
      makeAsset({ status: "draft" }),
      makeAsset({ status: "granted" }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.totalAssets).toBe(3);
    expect(metrics.byStatus.draft).toBe(2);
    expect(metrics.byStatus.granted).toBe(1);
    expect(metrics.byStatus.filed).toBe(0);
  });

  it("counts assets by type", () => {
    const assets = [
      makeAsset({ type: "patent" }),
      makeAsset({ type: "patent" }),
      makeAsset({ type: "trademark" }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.byType.patent).toBe(2);
    expect(metrics.byType.trademark).toBe(1);
    expect(metrics.byType.copyright).toBe(0);
  });

  it("groups assets by jurisdiction", () => {
    const assets = [
      makeAsset({ jurisdiction: { code: "US", name: "United States" } }),
      makeAsset({ jurisdiction: { code: "US", name: "United States" } }),
      makeAsset({ jurisdiction: { code: "EU", name: "European Union" } }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.byJurisdiction).toEqual(
      expect.arrayContaining([
        { code: "US", name: "United States", count: 2 },
        { code: "EU", name: "European Union", count: 1 },
      ])
    );
  });

  it("counts assets expiring within 90 days", () => {
    const now = new Date("2026-03-09");
    const assets = [
      makeAsset({ expirationDate: new Date("2026-04-01"), status: "granted" }),
      makeAsset({ expirationDate: new Date("2026-12-01"), status: "granted" }),
      makeAsset({ expirationDate: null, status: "draft" }),
      makeAsset({ expirationDate: new Date("2026-03-01"), status: "expired" }),
    ];
    const metrics = computePortfolioMetrics(assets, now);
    expect(metrics.expiringWithin90Days).toBe(1);
  });

  it("computes correct metrics on a pre-filtered subset of assets", () => {
    const now = new Date("2026-03-09");
    const allAssets = [
      makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, type: "patent", status: "granted", jurisdiction: { code: "US", name: "United States" } }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, type: "trademark", status: "filed", jurisdiction: { code: "EU", name: "European Union" } }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000003" as AssetId, type: "patent", status: "draft", jurisdiction: { code: "US", name: "United States" } }),
    ];
    // Simulate filtering to only patents
    const filtered = allAssets.filter((a) => a.type === "patent");
    const metrics = computePortfolioMetrics(filtered, now);

    expect(metrics.totalAssets).toBe(2);
    expect(metrics.byType.patent).toBe(2);
    expect(metrics.byType.trademark).toBe(0);
    expect(metrics.byStatus.granted).toBe(1);
    expect(metrics.byStatus.draft).toBe(1);
    expect(metrics.byStatus.filed).toBe(0);
    expect(metrics.byJurisdiction).toEqual([
      { code: "US", name: "United States", count: 2 },
    ]);
  });
});
