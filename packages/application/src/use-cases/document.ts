import type { DocumentId, DocumentStatus, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import { type Document, type CreateDocumentInput, createDocument, updateDocumentStatus } from "@ipms/domain";
import type { DocumentRepository } from "../ports.js";

export function createDocumentUseCase(repo: DocumentRepository) {
  return async (
    input: CreateDocumentInput,
  ): Promise<Result<Document>> => {
    const result = createDocument(input);
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function updateDocumentStatusUseCase(repo: DocumentRepository) {
  return async (
    id: DocumentId,
    orgId: OrganizationId,
    newStatus: DocumentStatus,
  ): Promise<Result<Document>> => {
    const doc = await repo.findById(id, orgId);
    if (!doc) return err("Document not found");

    const result = updateDocumentStatus(doc, newStatus);
    if (!result.ok) return result;

    await repo.save(result.value);
    return result;
  };
}

export function deleteDocumentUseCase(repo: DocumentRepository) {
  return async (
    id: DocumentId,
    orgId: OrganizationId,
  ): Promise<Result<true>> => {
    const deleted = await repo.delete(id, orgId);
    if (!deleted) return err("Document not found");
    return ok(true);
  };
}
