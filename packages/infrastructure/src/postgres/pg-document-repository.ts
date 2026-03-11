import { eq, and } from "drizzle-orm";
import type { AssetId, DocumentId, OrganizationId, DocumentType, DocumentStatus } from "@ipms/shared";
import type { Document } from "@ipms/domain";
import type { DocumentRepository } from "@ipms/application";
import { documents } from "./schema.js";
import type { Database } from "./connection.js";

type DocumentRow = typeof documents.$inferSelect;

function toEntity(row: DocumentRow): Document {
  return {
    id: row.id as DocumentId,
    assetId: row.assetId as AssetId,
    name: row.name,
    type: row.type as DocumentType,
    url: row.url,
    uploadedAt: row.uploadedAt,
    status: row.status as DocumentStatus,
    organizationId: row.organizationId as OrganizationId,
    tags: row.tags ?? [],
  };
}

export function createPgDocumentRepository(db: Database): DocumentRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(documents)
        .where(and(eq(documents.id, id), eq(documents.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(documents)
        .where(and(eq(documents.assetId, assetId), eq(documents.organizationId, orgId)));
      return rows.map(toEntity);
    },

    async findAll(orgId) {
      const rows = await db.select().from(documents)
        .where(eq(documents.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(doc) {
      await db.insert(documents).values({
        id: doc.id,
        assetId: doc.assetId,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        organizationId: doc.organizationId,
        tags: doc.tags,
      }).onConflictDoUpdate({
        target: documents.id,
        set: {
          assetId: doc.assetId,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          uploadedAt: doc.uploadedAt,
          status: doc.status,
          tags: doc.tags,
        },
      });
    },

    async delete(id, orgId) {
      const result = await db.delete(documents)
        .where(and(eq(documents.id, id), eq(documents.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
