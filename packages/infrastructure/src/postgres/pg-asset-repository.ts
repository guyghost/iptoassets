import { eq, and } from "drizzle-orm";
import type { AssetId, OrganizationId, AssetStatus, IPType } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";
import type { AssetRepository } from "@ipms/application";
import { assets } from "./schema.js";
import type { Database } from "./connection.js";

type AssetRow = typeof assets.$inferSelect;

function toEntity(row: AssetRow): IPAsset {
  return {
    id: row.id as AssetId,
    title: row.title,
    type: row.type as IPType,
    jurisdiction: { code: row.jurisdictionCode, name: row.jurisdictionName },
    status: row.status as AssetStatus,
    filingDate: row.filingDate,
    expirationDate: row.expirationDate,
    owner: row.owner,
    organizationId: row.organizationId as OrganizationId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPgAssetRepository(db: Database): AssetRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(assets)
        .where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll(orgId) {
      const rows = await db.select().from(assets)
        .where(eq(assets.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(asset) {
      await db.insert(assets).values({
        id: asset.id,
        title: asset.title,
        type: asset.type,
        jurisdictionCode: asset.jurisdiction.code,
        jurisdictionName: asset.jurisdiction.name,
        status: asset.status,
        filingDate: asset.filingDate,
        expirationDate: asset.expirationDate,
        owner: asset.owner,
        organizationId: asset.organizationId,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      }).onConflictDoUpdate({
        target: assets.id,
        set: {
          title: asset.title,
          type: asset.type,
          jurisdictionCode: asset.jurisdiction.code,
          jurisdictionName: asset.jurisdiction.name,
          status: asset.status,
          filingDate: asset.filingDate,
          expirationDate: asset.expirationDate,
          owner: asset.owner,
          updatedAt: asset.updatedAt,
        },
      });
    },

    async delete(id, orgId) {
      const result = await db.delete(assets)
        .where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
