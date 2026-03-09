import { describe, it, expect } from "vitest";
import { createAsset, updateAssetStatus, validateStatusTransition, filterAssets, bulkValidateStatusTransition } from "./asset.js";
import type { CreateAssetInput, AssetFilter } from "./asset.js";
import type { IPAsset } from "./entities.js";
import type { AssetId, OrganizationId, AssetStatus } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;

const validInput: CreateAssetInput = {
  id: ASSET_ID,
  title: "Test Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  owner: "Acme Corp",
  organizationId: ORG_ID,
};

describe("createAsset", () => {
  it("creates an asset with valid input", () => {
    const result = createAsset(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("Test Patent");
      expect(result.value.status).toBe("draft");
      expect(result.value.filingDate).toBeNull();
      expect(result.value.type).toBe("patent");
    }
  });

  it("rejects empty title", () => {
    const result = createAsset({ ...validInput, title: "  " });
    expect(result).toEqual({ ok: false, error: "Asset title cannot be empty" });
  });

  it("rejects empty owner", () => {
    const result = createAsset({ ...validInput, owner: "" });
    expect(result).toEqual({ ok: false, error: "Asset owner cannot be empty" });
  });

  it("rejects empty jurisdiction", () => {
    const result = createAsset({
      ...validInput,
      jurisdiction: { code: "", name: "US" },
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateStatusTransition", () => {
  const validTransitions: [AssetStatus, AssetStatus][] = [
    ["draft", "filed"],
    ["draft", "abandoned"],
    ["filed", "published"],
    ["filed", "granted"],
    ["filed", "abandoned"],
    ["published", "granted"],
    ["published", "abandoned"],
    ["granted", "expired"],
  ];

  const invalidTransitions: [AssetStatus, AssetStatus][] = [
    ["draft", "granted"],
    ["draft", "expired"],
    ["filed", "draft"],
    ["granted", "draft"],
    ["expired", "draft"],
    ["abandoned", "draft"],
    ["expired", "granted"],
  ];

  it.each(validTransitions)("allows %s -> %s", (from, to) => {
    expect(validateStatusTransition(from, to).ok).toBe(true);
  });

  it.each(invalidTransitions)("rejects %s -> %s", (from, to) => {
    expect(validateStatusTransition(from, to).ok).toBe(false);
  });
});

describe("updateAssetStatus", () => {
  it("updates status when transition is valid", () => {
    const assetResult = createAsset(validInput);
    expect(assetResult.ok).toBe(true);
    if (!assetResult.ok) return;

    const result = updateAssetStatus(assetResult.value, "filed");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("filed");
    }
  });

  it("rejects invalid transition", () => {
    const assetResult = createAsset(validInput);
    if (!assetResult.ok) return;

    const result = updateAssetStatus(assetResult.value, "granted");
    expect(result.ok).toBe(false);
  });
});

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "660e8400-e29b-41d4-a716-446655440000" as AssetId,
  title: "Test Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "draft",
  filingDate: null,
  expirationDate: null,
  owner: "Acme Corp",
  organizationId: ORG_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

const testAssets: IPAsset[] = [
  makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, title: "Alpha Patent", type: "patent", status: "filed", jurisdiction: { code: "US", name: "United States" }, owner: "Alice" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, title: "Beta Trademark", type: "trademark", status: "granted", jurisdiction: { code: "EU", name: "European Union" }, owner: "Bob" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000003" as AssetId, title: "Gamma Copyright", type: "copyright", status: "draft", jurisdiction: { code: "US", name: "United States" }, owner: "Alice" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000004" as AssetId, title: "Delta Design", type: "design-right", status: "expired", jurisdiction: { code: "JP", name: "Japan" }, owner: "Charlie", filingDate: new Date("2025-06-15") }),
];

describe("filterAssets", () => {
  it("returns all assets when filter is empty", () => {
    expect(filterAssets(testAssets, {})).toHaveLength(4);
  });

  it("filters by status", () => {
    const result = filterAssets(testAssets, { status: ["filed", "granted"] });
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.title)).toEqual(["Alpha Patent", "Beta Trademark"]);
  });

  it("filters by type", () => {
    const result = filterAssets(testAssets, { type: ["patent", "copyright"] });
    expect(result).toHaveLength(2);
  });

  it("filters by jurisdiction code", () => {
    const result = filterAssets(testAssets, { jurisdiction: "US" });
    expect(result).toHaveLength(2);
  });

  it("filters by owner", () => {
    const result = filterAssets(testAssets, { owner: "Alice" });
    expect(result).toHaveLength(2);
  });

  it("searches by title (case-insensitive)", () => {
    const result = filterAssets(testAssets, { search: "beta" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Beta Trademark");
  });

  it("filters by date range using filingDate", () => {
    const result = filterAssets(testAssets, {
      dateFrom: new Date("2025-06-01"),
      dateTo: new Date("2025-07-01"),
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Delta Design");
  });

  it("combines multiple filters", () => {
    const result = filterAssets(testAssets, { status: ["draft"], owner: "Alice" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Gamma Copyright");
  });

  it("returns empty array when no matches", () => {
    const result = filterAssets(testAssets, { search: "nonexistent" });
    expect(result).toHaveLength(0);
  });
});

describe("bulkValidateStatusTransition", () => {
  it("returns all assets as valid when transition is allowed", () => {
    const assets = [
      makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, status: "draft" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, status: "draft" }),
    ];
    const result = bulkValidateStatusTransition(assets, "filed");
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("separates valid and invalid transitions", () => {
    const assets = [
      makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, status: "draft" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, status: "granted" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000003" as AssetId, status: "expired" }),
    ];
    const result = bulkValidateStatusTransition(assets, "filed");
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]!.reason).toContain("Invalid status transition");
  });

  it("handles empty array", () => {
    const result = bulkValidateStatusTransition([], "filed");
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
