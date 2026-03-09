import type { AssetId, DocumentId, DocumentType, DocumentStatus, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Document } from "./entities.js";

export interface CreateDocumentInput {
  readonly id: DocumentId;
  readonly assetId: AssetId;
  readonly name: string;
  readonly type: DocumentType;
  readonly url: string;
  readonly organizationId: OrganizationId;
}

export function createDocument(input: CreateDocumentInput): Result<Document> {
  if (!input.name.trim()) {
    return err("Document name cannot be empty");
  }
  if (!input.url.trim()) {
    return err("Document URL cannot be empty");
  }

  return ok({
    id: input.id,
    assetId: input.assetId,
    name: input.name.trim(),
    type: input.type,
    url: input.url.trim(),
    uploadedAt: new Date(),
    status: "uploaded" as const,
    organizationId: input.organizationId,
  });
}

const VALID_DOC_TRANSITIONS: Record<DocumentStatus, readonly DocumentStatus[]> = {
  "uploaded": ["under-review"],
  "under-review": ["approved", "rejected"],
  "approved": [],
  "rejected": ["under-review"],
};

export function updateDocumentStatus(
  doc: Document,
  newStatus: DocumentStatus,
): Result<Document> {
  if (!VALID_DOC_TRANSITIONS[doc.status].includes(newStatus)) {
    return err(`Invalid document status transition: ${doc.status} -> ${newStatus}`);
  }
  return ok({ ...doc, status: newStatus });
}
