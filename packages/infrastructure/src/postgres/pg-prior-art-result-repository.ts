import { eq, and } from "drizzle-orm";
import type { AssetId, OrganizationId, PriorArtResultId } from "@ipms/shared";
import type { PriorArtResult } from "@ipms/domain";
import type { PriorArtResultRepository } from "@ipms/application";
import { priorArtResults } from "./schema.js";
import type { Database } from "./connection.js";

export function createPgPriorArtResultRepository(db: Database): PriorArtResultRepository {
  return {
    async save(result) {
      await db.insert(priorArtResults).values({
        id: result.id,
        assetId: result.assetId,
        organizationId: result.organizationId,
        patentNumber: result.patentNumber,
        title: result.title,
        abstractText: result.abstractText,
        relevanceScore: String(result.relevanceScore),
        relevanceReasoning: result.relevanceReasoning,
        source: result.source,
        searchedAt: result.searchedAt,
      }).onConflictDoUpdate({
        target: priorArtResults.id,
        set: {
          relevanceScore: String(result.relevanceScore),
          relevanceReasoning: result.relevanceReasoning,
        },
      });
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(priorArtResults)
        .where(and(
          eq(priorArtResults.assetId, assetId),
          eq(priorArtResults.organizationId, orgId),
        ));
      return rows.map((row): PriorArtResult => ({
        id: row.id as PriorArtResultId,
        assetId: row.assetId as AssetId,
        organizationId: row.organizationId as OrganizationId,
        patentNumber: row.patentNumber,
        title: row.title,
        abstractText: row.abstractText,
        relevanceScore: Number(row.relevanceScore) || 0,
        relevanceReasoning: row.relevanceReasoning,
        source: row.source as "uspto",
        searchedAt: row.searchedAt,
      }));
    },

    async deleteByAssetId(assetId, orgId) {
      await db.delete(priorArtResults).where(and(
        eq(priorArtResults.assetId, assetId),
        eq(priorArtResults.organizationId, orgId),
      ));
    },
  };
}
