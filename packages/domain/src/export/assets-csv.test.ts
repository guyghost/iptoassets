import { describe, it, expect } from "vitest";
import { assetsToCSVRows } from "./assets-csv.js";
import type { IPAsset } from "../entities.js";
import type { AssetId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "a0000000-0000-0000-0000-000000000001" as AssetId,
  title: "Test Patent",
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

describe("assetsToCSVRows", () => {
  it("returns header row for empty array", () => {
    const rows = assetsToCSVRows([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["ID", "Title", "Type", "Jurisdiction", "Status", "Owner", "Filing Date", "Expiration Date"]);
  });

  it("converts assets to CSV rows", () => {
    const assets = [
      makeAsset({ title: "My Patent", type: "patent", status: "filed", filingDate: new Date("2026-01-15") }),
    ];
    const rows = assetsToCSVRows(assets);
    expect(rows).toHaveLength(2);
    expect(rows[1]![1]).toBe("My Patent");
    expect(rows[1]![2]).toBe("patent");
    expect(rows[1]![4]).toBe("filed");
  });

  it("handles null dates", () => {
    const rows = assetsToCSVRows([makeAsset({})]);
    expect(rows[1]![6]).toBe("");
    expect(rows[1]![7]).toBe("");
  });
});
