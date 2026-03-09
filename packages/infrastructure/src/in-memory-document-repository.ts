import type { AssetId, DocumentId, OrganizationId } from "@ipms/shared";
import type { Document } from "@ipms/domain";
import type { DocumentRepository } from "@ipms/application";

export function createInMemoryDocumentRepository(): DocumentRepository {
  const store = new Map<string, Document>();

  const key = (id: DocumentId, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findByAssetId(assetId: AssetId, orgId: OrganizationId) {
      return [...store.values()].filter(
        (d) => d.assetId === assetId && d.organizationId === orgId,
      );
    },

    async findAll(orgId) {
      return [...store.values()].filter((d) => d.organizationId === orgId);
    },

    async save(doc) {
      store.set(key(doc.id, doc.organizationId), doc);
    },

    async delete(id, orgId) {
      return store.delete(key(id, orgId));
    },
  };
}
