import { describe, it, expect } from "vitest";
import { classifyDocumentUseCase } from "@ipms/application";
import { createInMemoryDocumentRepository } from "./in-memory-document-repository.js";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import type { DocumentId, AssetId, OrganizationId } from "@ipms/shared";
import type { Document, IPAsset } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const DOC_ID = "660e8400-e29b-41d4-a716-446655440000" as DocumentId;
const ASSET_ID = "770e8400-e29b-41d4-a716-446655440000" as AssetId;

describe("classifyDocumentUseCase", () => {
  it("classifies a document with AI-suggested tags", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const assetRepo = createInMemoryAssetRepository();
    const aiService = {
      async complete() { return '["patent", "claims", "filing"]'; },
    };

    const doc: Document = {
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Claims Draft v2",
      type: "claim",
      url: "https://example.com/doc.pdf",
      uploadedAt: new Date(),
      status: "uploaded",
      organizationId: ORG_ID,
      tags: [],
    };
    await docRepo.save(doc);

    const asset: IPAsset = {
      id: ASSET_ID,
      title: "Quantum Computing Patent",
      type: "patent",
      jurisdiction: { code: "US", name: "United States" },
      status: "filed",
      filingDate: null,
      expirationDate: null,
      owner: "Acme",
      organizationId: ORG_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await assetRepo.save(asset);

    const classify = classifyDocumentUseCase(docRepo, assetRepo, aiService);
    const result = await classify(DOC_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tags).toEqual(["patent", "claims", "filing"]);
    }
  });

  it("handles malformed AI response gracefully", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const assetRepo = createInMemoryAssetRepository();
    const aiService = {
      async complete() { return "not valid json"; },
    };

    const doc: Document = {
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Test Doc",
      type: "claim",
      url: "https://example.com",
      uploadedAt: new Date(),
      status: "uploaded",
      organizationId: ORG_ID,
      tags: [],
    };
    await docRepo.save(doc);

    const classify = classifyDocumentUseCase(docRepo, assetRepo, aiService);
    const result = await classify(DOC_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tags).toEqual([]);
    }
  });
});
