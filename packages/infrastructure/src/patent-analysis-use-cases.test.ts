import { describe, it, expect } from "vitest";
import { analyzeClaimsUseCase, assessPatentabilityUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "770e8400-e29b-41d4-a716-446655440000" as AssetId;

const ASSET: IPAsset = {
  id: ASSET_ID,
  title: "Quantum Computing Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "filed",
  filingDate: null,
  expirationDate: null,
  owner: "Acme",
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("analyzeClaimsUseCase", () => {
  it("analyzes claims and returns structured result", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = {
      async complete() {
        return JSON.stringify({
          overallScore: 7,
          claims: [
            { number: 1, summary: "Main method claim", strength: "strong", issues: [] },
            { number: 2, summary: "Dependent claim", strength: "moderate", issues: ["Too broad"] },
          ],
          strengths: ["Novel approach"],
          weaknesses: ["Claim 2 too broad"],
          recommendations: ["Narrow claim 2"],
        });
      },
    };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "1. A method for...\n2. The method of claim 1...");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBe(7);
      expect(result.value.claims).toHaveLength(2);
      expect(result.value.claims[0].strength).toBe("strong");
      expect(result.value.strengths).toEqual(["Novel approach"]);
      expect(result.value.recommendations).toEqual(["Narrow claim 2"]);
    }
  });

  it("returns error for non-existent asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    const aiService = { async complete() { return ""; } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Asset not found");
  });

  it("handles malformed AI response", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { return "not json"; } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Failed to parse AI response");
  });

  it("handles AI service failure", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { throw new Error("API down"); } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("AI service unavailable");
  });
});

describe("assessPatentabilityUseCase", () => {
  it("assesses patentability and returns structured result", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = {
      async complete() {
        return JSON.stringify({
          overallScore: 8,
          novelty: { score: 9, reasoning: "Highly novel approach" },
          nonObviousness: { score: 7, reasoning: "Some prior art exists" },
          utility: { score: 8, reasoning: "Clear practical application" },
          risks: ["Similar prior art in adjacent field"],
          recommendations: ["Conduct prior art search"],
        });
      },
    };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "This invention relates to...");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBe(8);
      expect(result.value.novelty.score).toBe(9);
      expect(result.value.nonObviousness.reasoning).toBe("Some prior art exists");
      expect(result.value.risks).toEqual(["Similar prior art in adjacent field"]);
    }
  });

  it("returns error for non-existent asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    const aiService = { async complete() { return ""; } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Asset not found");
  });

  it("handles malformed AI response", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { return "invalid"; } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Failed to parse AI response");
  });

  it("handles AI service failure", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { throw new Error("API down"); } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("AI service unavailable");
  });
});
