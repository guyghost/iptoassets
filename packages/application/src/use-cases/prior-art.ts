import type { AssetId, OrganizationId, PriorArtResultId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { PriorArtResult } from "@ipms/domain";
import type { AssetRepository, PatentSearchService, AIService, PriorArtResultRepository } from "../ports.js";
import crypto from "node:crypto";

const RELEVANCE_SYSTEM_PROMPT = `You are an expert patent attorney evaluating prior art relevance. Given a target patent/invention and a prior art patent, assess its relevance.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "relevanceScore": <number 1-10>,
  "reasoning": "<brief explanation of relevance>"
}`;

export function searchPriorArtUseCase(
  assetRepo: AssetRepository,
  patentSearchService: PatentSearchService,
  aiService: AIService,
  priorArtRepo: PriorArtResultRepository,
) {
  return async (assetId: AssetId, orgId: OrganizationId, keywords?: string): Promise<Result<readonly PriorArtResult[]>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return err("Asset not found");

    const query = keywords?.trim() || `${asset.title} ${asset.type}`;
    let patents: Awaited<ReturnType<PatentSearchService["search"]>>;
    try {
      patents = await patentSearchService.search(query, 10);
    } catch {
      return err("Patent search service unavailable");
    }

    if (patents.length === 0) return ok([]);

    // Delete previous results for this asset
    await priorArtRepo.deleteByAssetId(assetId, orgId);

    const results: PriorArtResult[] = [];
    for (const patent of patents) {
      let relevanceScore = 5;
      let relevanceReasoning = "Analysis unavailable";

      try {
        const response = await aiService.complete(
          RELEVANCE_SYSTEM_PROMPT,
          `Target patent: "${asset.title}" (${asset.type}, ${asset.jurisdiction.code})\n\nPrior art patent: "${patent.title}"\nPatent number: ${patent.patentNumber}\nAbstract: ${patent.abstractText}`,
        );
        const parsed = JSON.parse(response);
        relevanceScore = Number(parsed.relevanceScore) || 5;
        relevanceReasoning = String(parsed.reasoning ?? "Analysis unavailable");
      } catch {
        // Use defaults if AI fails for this patent
      }

      const result: PriorArtResult = {
        id: crypto.randomUUID() as PriorArtResultId,
        assetId,
        organizationId: orgId,
        patentNumber: patent.patentNumber,
        title: patent.title,
        abstractText: patent.abstractText,
        relevanceScore,
        relevanceReasoning,
        source: "uspto",
        searchedAt: new Date(),
      };
      await priorArtRepo.save(result);
      results.push(result);
    }

    return ok(results);
  };
}

export function listPriorArtUseCase(priorArtRepo: PriorArtResultRepository) {
  return async (assetId: AssetId, orgId: OrganizationId): Promise<Result<readonly PriorArtResult[]>> => {
    const results = await priorArtRepo.findByAssetId(assetId, orgId);
    return ok(results);
  };
}
