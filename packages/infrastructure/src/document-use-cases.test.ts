import { describe, it, expect } from "vitest";
import { updateDocumentStatusUseCase } from "@ipms/application";
import { createInMemoryDocumentRepository } from "./in-memory-document-repository.js";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import type { DocumentId, AssetId, OrganizationId, UserId, MembershipId } from "@ipms/shared";
import type { Document } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;
const DOC_ID = "770e8400-e29b-41d4-a716-446655440000" as DocumentId;
const ASSET_ID = "880e8400-e29b-41d4-a716-446655440000" as AssetId;

const UPLOADED_DOC: Document = {
  id: DOC_ID,
  assetId: ASSET_ID,
  name: "Claims Draft",
  type: "claim",
  url: "https://example.com/doc.pdf",
  uploadedAt: new Date(),
  status: "uploaded",
  organizationId: ORG_ID,
};

describe("updateDocumentStatusUseCase with email", () => {
  it("sends email when document moves to under-review", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const notifRepo = createInMemoryNotificationRepository();
    const memRepo = createInMemoryMembershipRepository();
    const userRepo = createInMemoryUserRepository();
    const sentEmails: Array<{ to: string; subject: string }> = [];
    const emailService = {
      async send(to: string, subject: string, _html: string) {
        sentEmails.push({ to, subject });
      },
    };

    await docRepo.save(UPLOADED_DOC);
    await userRepo.save({
      id: USER_ID,
      email: "attorney@example.com",
      name: "Attorney",
      avatarUrl: null,
      authProviderId: "google:456",
      createdAt: new Date(),
    });
    await memRepo.save({
      id: "990e8400-e29b-41d4-a716-446655440000" as MembershipId,
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "attorney",
      joinedAt: new Date(),
    });

    const update = updateDocumentStatusUseCase(docRepo, emailService, notifRepo, memRepo, userRepo);
    const result = await update(DOC_ID, ORG_ID, "under-review");

    expect(result.ok).toBe(true);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].subject).toContain("review");
  });

  it("updates status correctly", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const notifRepo = createInMemoryNotificationRepository();
    const memRepo = createInMemoryMembershipRepository();
    const userRepo = createInMemoryUserRepository();
    const { createNoOpEmailService } = await import("./noop-email-service.js");

    await docRepo.save(UPLOADED_DOC);
    const update = updateDocumentStatusUseCase(docRepo, createNoOpEmailService(), notifRepo, memRepo, userRepo);
    const result = await update(DOC_ID, ORG_ID, "under-review");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("under-review");
  });
});
