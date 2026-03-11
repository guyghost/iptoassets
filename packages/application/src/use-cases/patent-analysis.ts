import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { ClaimAnalysis } from "@ipms/domain";
import type { AssetRepository, AIService } from "../ports.js";

const CLAIMS_SYSTEM_PROMPT = `You are an expert patent attorney analyzing patent claims. Given the patent context and claims text, analyze each claim for strength and issues.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "overallScore": <number 1-10>,
  "claims": [
    {
      "number": <claim number>,
      "summary": "<one sentence summary>",
      "strength": "<strong|moderate|weak>",
      "issues": ["<issue 1>", "<issue 2>"]
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

export function analyzeClaimsUseCase(
  assetRepo: AssetRepository,
  aiService: AIService,
) {
  return async (assetId: AssetId, orgId: OrganizationId, claimsText: string): Promise<Result<ClaimAnalysis>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return err("Asset not found");

    let response: string;
    try {
      response = await aiService.complete(
        CLAIMS_SYSTEM_PROMPT,
        `Patent: "${asset.title}"\nType: ${asset.type}\nJurisdiction: ${asset.jurisdiction.code} (${asset.jurisdiction.name})\n\nClaims:\n${claimsText}`,
      );
    } catch {
      return err("AI service unavailable");
    }

    try {
      const parsed = JSON.parse(response);
      const analysis: ClaimAnalysis = {
        overallScore: Number(parsed.overallScore) || 0,
        claims: Array.isArray(parsed.claims)
          ? parsed.claims.map((c: Record<string, unknown>) => ({
              number: Number(c.number) || 0,
              summary: String(c.summary ?? ""),
              strength: ["strong", "moderate", "weak"].includes(c.strength as string) ? c.strength as "strong" | "moderate" | "weak" : "moderate",
              issues: Array.isArray(c.issues) ? c.issues.filter((i: unknown): i is string => typeof i === "string") : [],
            }))
          : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s: unknown): s is string => typeof s === "string") : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((s: unknown): s is string => typeof s === "string") : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((s: unknown): s is string => typeof s === "string") : [],
      };
      return ok(analysis);
    } catch {
      return err("Failed to parse AI response");
    }
  };
}
