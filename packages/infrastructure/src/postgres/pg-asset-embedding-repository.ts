import { eq, sql } from "drizzle-orm";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { AssetEmbeddingRepository } from "@ipms/application";
import { assetEmbeddings } from "./schema.js";
import type { Database } from "./connection.js";

export function createPgAssetEmbeddingRepository(db: Database): AssetEmbeddingRepository {
  return {
    async save(assetId, orgId, embedding) {
      const vectorStr = `[${embedding.join(",")}]`;
      await db.insert(assetEmbeddings).values({
        assetId,
        organizationId: orgId,
        embedding: vectorStr,
      }).onConflictDoUpdate({
        target: assetEmbeddings.assetId,
        set: {
          embedding: vectorStr,
          organizationId: orgId,
        },
      });
    },

    async searchByVector(orgId, embedding, limit) {
      const vectorStr = `[${embedding.join(",")}]`;
      const rows = await db.select({ assetId: assetEmbeddings.assetId })
        .from(assetEmbeddings)
        .where(eq(assetEmbeddings.organizationId, orgId))
        .orderBy(sql`embedding <=> ${vectorStr}::vector`)
        .limit(limit);
      return rows.map((r) => r.assetId as AssetId);
    },

    async deleteByAssetId(assetId) {
      await db.delete(assetEmbeddings).where(eq(assetEmbeddings.assetId, assetId));
    },
  };
}
