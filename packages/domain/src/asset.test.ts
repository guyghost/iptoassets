import { describe, it, expect } from "vitest";
import { createAsset, updateAssetStatus, validateStatusTransition } from "./asset.js";
import type { CreateAssetInput } from "./asset.js";
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
