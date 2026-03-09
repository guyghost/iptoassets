import { describe, it, expect } from "vitest";
import { createPortfolio, addAssetToPortfolio, removeAssetFromPortfolio } from "./portfolio.js";
import type { AssetId, OrganizationId, PortfolioId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const PORTFOLIO_ID = "990e8400-e29b-41d4-a716-446655440000" as PortfolioId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;

describe("createPortfolio", () => {
  it("creates a portfolio with valid input", () => {
    const result = createPortfolio({
      id: PORTFOLIO_ID,
      name: "Tech Patents",
      description: "All technology patents",
      owner: "Legal Team",
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Tech Patents");
      expect(result.value.assetIds).toEqual([]);
    }
  });

  it("rejects empty name", () => {
    const result = createPortfolio({
      id: PORTFOLIO_ID,
      name: "",
      description: "",
      owner: "Legal",
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(false);
  });
});

describe("addAssetToPortfolio", () => {
  it("adds an asset to portfolio", () => {
    const created = createPortfolio({
      id: PORTFOLIO_ID,
      name: "Test",
      description: "",
      owner: "Legal",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const result = addAssetToPortfolio(created.value, ASSET_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assetIds).toContain(ASSET_ID);
    }
  });

  it("rejects duplicate asset", () => {
    const created = createPortfolio({
      id: PORTFOLIO_ID,
      name: "Test",
      description: "",
      owner: "Legal",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const added = addAssetToPortfolio(created.value, ASSET_ID);
    if (!added.ok) return;

    const result = addAssetToPortfolio(added.value, ASSET_ID);
    expect(result.ok).toBe(false);
  });
});

describe("removeAssetFromPortfolio", () => {
  it("removes an asset from portfolio", () => {
    const created = createPortfolio({
      id: PORTFOLIO_ID,
      name: "Test",
      description: "",
      owner: "Legal",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const added = addAssetToPortfolio(created.value, ASSET_ID);
    if (!added.ok) return;

    const result = removeAssetFromPortfolio(added.value, ASSET_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assetIds).not.toContain(ASSET_ID);
    }
  });

  it("rejects removing non-existent asset", () => {
    const created = createPortfolio({
      id: PORTFOLIO_ID,
      name: "Test",
      description: "",
      owner: "Legal",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const result = removeAssetFromPortfolio(created.value, ASSET_ID);
    expect(result.ok).toBe(false);
  });
});
