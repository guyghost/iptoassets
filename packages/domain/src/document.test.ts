import { describe, it, expect } from "vitest";
import { createDocument, updateDocumentStatus, updateDocumentTags } from "./document.js";
import type { AssetId, DocumentId, DocumentStatus, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;
const DOC_ID = "880e8400-e29b-41d4-a716-446655440000" as DocumentId;

describe("createDocument", () => {
  it("creates a document with valid input", () => {
    const result = createDocument({
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Patent Filing.pdf",
      type: "filing",
      url: "https://example.com/file.pdf",
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("uploaded");
      expect(result.value.name).toBe("Patent Filing.pdf");
    }
  });

  it("rejects empty name", () => {
    const result = createDocument({
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "",
      type: "filing",
      url: "https://example.com/file.pdf",
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(false);
  });
});

describe("updateDocumentStatus", () => {
  it("allows uploaded -> under-review", () => {
    const created = createDocument({
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Test",
      type: "filing",
      url: "https://example.com/file.pdf",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const result = updateDocumentStatus(created.value, "under-review");
    expect(result.ok).toBe(true);
  });

  it("rejects uploaded -> approved", () => {
    const created = createDocument({
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Test",
      type: "filing",
      url: "https://example.com/file.pdf",
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const result = updateDocumentStatus(created.value, "approved");
    expect(result.ok).toBe(false);
  });
});

describe("updateDocumentTags", () => {
  it("updates document tags", () => {
    const doc = {
      id: "550e8400-e29b-41d4-a716-446655440000" as DocumentId,
      assetId: "660e8400-e29b-41d4-a716-446655440000" as AssetId,
      name: "Test",
      type: "claim" as const,
      url: "https://example.com",
      uploadedAt: new Date(),
      status: "uploaded" as const,
      organizationId: "770e8400-e29b-41d4-a716-446655440000" as OrganizationId,
      tags: [] as readonly string[],
    };
    const result = updateDocumentTags(doc, ["patent", "claims", "draft"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tags).toEqual(["patent", "claims", "draft"]);
  });
});
