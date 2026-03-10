import type { DocumentId, DocumentStatus, OrganizationId, NotificationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import { type Document, type CreateDocumentInput, createDocument, updateDocumentStatus, createNotification, renderEmailTemplate } from "@ipms/domain";
import type { DocumentEmailData } from "@ipms/domain";
import type { DocumentRepository, EmailService, NotificationRepository, MembershipRepository, UserRepository } from "../ports.js";

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

export function updateDocumentStatusUseCase(
  repo: DocumentRepository,
  emailService: EmailService,
  notificationRepo: NotificationRepository,
  memberRepo: MembershipRepository,
  userRepo: UserRepository,
) {
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

    // Send notifications for specific status transitions
    const notificationType =
      newStatus === "under-review" ? "document:review" as const :
      newStatus === "approved" ? "document:approved" as const :
      newStatus === "rejected" ? "document:rejected" as const :
      null;

    if (notificationType) {
      try {
        const members = await memberRepo.findByOrganizationId(orgId);
        for (const member of members) {
          const notifResult = createNotification({
            id: crypto.randomUUID() as NotificationId,
            organizationId: orgId,
            recipientId: member.userId,
            type: notificationType,
            title: notificationType === "document:review"
              ? `Document ready for review: ${doc.name}`
              : notificationType === "document:approved"
              ? `Document approved: ${doc.name}`
              : `Document rejected: ${doc.name}`,
            message: `Document "${doc.name}" status changed to ${newStatus}`,
            entityType: "document",
            entityId: doc.id,
          });
          if (notifResult.ok) {
            await notificationRepo.save(notifResult.value);
          }

          // Send email (best-effort)
          try {
            const user = await userRepo.findById(member.userId);
            if (user) {
              const email = renderEmailTemplate(notificationType, {
                documentName: doc.name,
                assetTitle: doc.assetId,
                appUrl: "",
              } as DocumentEmailData);
              await emailService.send(user.email, email.subject, email.html);
            }
          } catch {
            // Email failure is non-blocking
          }
        }
      } catch {
        // Notification failure is non-blocking
      }
    }

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
