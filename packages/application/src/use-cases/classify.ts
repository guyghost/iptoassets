import type { DocumentId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Document } from "@ipms/domain";
import { updateDocumentTags } from "@ipms/domain";
import type { DocumentRepository, AssetRepository, AIService } from "../ports.js";

export function classifyDocumentUseCase(
  docRepo: DocumentRepository,
  assetRepo: AssetRepository,
  aiService: AIService,
) {
  return async (docId: DocumentId, orgId: OrganizationId): Promise<Result<Document>> => {
    const doc = await docRepo.findById(docId, orgId);
    if (!doc) return err("Document not found");

    const asset = await assetRepo.findById(doc.assetId, orgId);
    const assetTitle = asset ? asset.title : "Unknown";

    const response = await aiService.complete(
      "You are an IP document classifier. Given a document name, type, and its associated patent/asset title, suggest 3-5 classification tags. Return ONLY a JSON array of lowercase strings, nothing else. Example: [\"patent\", \"claims\", \"draft\"]",
      `Document name: "${doc.name}"\nDocument type: ${doc.type}\nAsset: "${assetTitle}"`,
    );

    let tags: string[];
    try {
      tags = JSON.parse(response);
      if (!Array.isArray(tags)) tags = [];
      tags = tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase().trim()).filter(Boolean);
    } catch {
      tags = [];
    }

    const result = updateDocumentTags(doc, tags);
    if (!result.ok) return result;

    await docRepo.save(result.value);
    return result;
  };
}
