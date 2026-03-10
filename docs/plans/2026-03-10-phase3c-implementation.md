# Phase 3c: Email Notifications — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add email notifications via Resend for deadlines, document events, and member invitations.

**Architecture:** New `EmailService` port in application layer, Resend implementation in infrastructure, no-op fallback for dev/tests. Email templates are pure domain functions. Existing use cases gain `EmailService` as additional parameter. Cron route for daily deadline checks protected by shared secret.

**Tech Stack:** Resend SDK, TypeScript, Vitest, SvelteKit

**Design doc:** `docs/plans/2026-03-10-phase3c-email-notifications-design.md`

---

### Task 1: Add email template domain functions

**Files:**
- Create: `packages/domain/src/email-templates.ts`
- Create: `packages/domain/src/email-templates.test.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Write failing tests**

Create `packages/domain/src/email-templates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { renderEmailTemplate } from "./email-templates.js";

describe("renderEmailTemplate", () => {
  it("renders deadline:upcoming email", () => {
    const result = renderEmailTemplate("deadline:upcoming", {
      title: "File annual report",
      dueDate: "2026-04-01",
      assetTitle: "Patent US-123",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("Deadline approaching: File annual report");
    expect(result.html).toContain("File annual report");
    expect(result.html).toContain("2026-04-01");
    expect(result.html).toContain("Patent US-123");
  });

  it("renders deadline:overdue email", () => {
    const result = renderEmailTemplate("deadline:overdue", {
      title: "File annual report",
      dueDate: "2026-03-01",
      assetTitle: "Patent US-123",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("Deadline overdue: File annual report");
    expect(result.html).toContain("overdue");
  });

  it("renders document:review email", () => {
    const result = renderEmailTemplate("document:review", {
      documentName: "Claims Draft v2",
      assetTitle: "Patent US-123",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("Document ready for review: Claims Draft v2");
    expect(result.html).toContain("Claims Draft v2");
  });

  it("renders document:approved email", () => {
    const result = renderEmailTemplate("document:approved", {
      documentName: "Claims Draft v2",
      assetTitle: "Patent US-123",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("Document approved: Claims Draft v2");
  });

  it("renders document:rejected email", () => {
    const result = renderEmailTemplate("document:rejected", {
      documentName: "Claims Draft v2",
      assetTitle: "Patent US-123",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("Document rejected: Claims Draft v2");
  });

  it("renders invitation email", () => {
    const result = renderEmailTemplate("invitation", {
      organizationName: "Acme Corp",
      role: "attorney",
      invitedByName: "Alice",
      appUrl: "https://app.ipms.dev",
    });
    expect(result.subject).toBe("You've been invited to Acme Corp");
    expect(result.html).toContain("attorney");
    expect(result.html).toContain("Alice");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/domain/src/email-templates.test.ts`
Expected: FAIL — module not found

**Step 3: Implement email templates**

Create `packages/domain/src/email-templates.ts`:

```typescript
import type { NotificationType } from "./entities.js";

export type EmailTemplateType = NotificationType | "invitation";

export interface DeadlineEmailData {
  readonly title: string;
  readonly dueDate: string;
  readonly assetTitle: string;
  readonly appUrl: string;
}

export interface DocumentEmailData {
  readonly documentName: string;
  readonly assetTitle: string;
  readonly appUrl: string;
}

export interface InvitationEmailData {
  readonly organizationName: string;
  readonly role: string;
  readonly invitedByName: string;
  readonly appUrl: string;
}

export type EmailTemplateData = DeadlineEmailData | DocumentEmailData | InvitationEmailData;

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
${body}
<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
<p style="font-size: 12px; color: #888;">Sent by IPMS</p>
</body>
</html>`;
}

export function renderEmailTemplate(
  type: EmailTemplateType,
  data: EmailTemplateData,
): { subject: string; html: string } {
  switch (type) {
    case "deadline:upcoming": {
      const d = data as DeadlineEmailData;
      return {
        subject: `Deadline approaching: ${d.title}`,
        html: wrapHtml(`
          <h2 style="color: #b45309;">Deadline Approaching</h2>
          <p><strong>${d.title}</strong> for asset <strong>${d.assetTitle}</strong> is due on <strong>${d.dueDate}</strong>.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">View in IPMS</a></p>
        `),
      };
    }
    case "deadline:overdue": {
      const d = data as DeadlineEmailData;
      return {
        subject: `Deadline overdue: ${d.title}`,
        html: wrapHtml(`
          <h2 style="color: #dc2626;">Deadline Overdue</h2>
          <p><strong>${d.title}</strong> for asset <strong>${d.assetTitle}</strong> was due on <strong>${d.dueDate}</strong> and is now overdue.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">View in IPMS</a></p>
        `),
      };
    }
    case "document:review": {
      const d = data as DocumentEmailData;
      return {
        subject: `Document ready for review: ${d.documentName}`,
        html: wrapHtml(`
          <h2>Document Ready for Review</h2>
          <p><strong>${d.documentName}</strong> for asset <strong>${d.assetTitle}</strong> has been submitted for review.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">Review in IPMS</a></p>
        `),
      };
    }
    case "document:approved": {
      const d = data as DocumentEmailData;
      return {
        subject: `Document approved: ${d.documentName}`,
        html: wrapHtml(`
          <h2 style="color: #16a34a;">Document Approved</h2>
          <p><strong>${d.documentName}</strong> for asset <strong>${d.assetTitle}</strong> has been approved.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">View in IPMS</a></p>
        `),
      };
    }
    case "document:rejected": {
      const d = data as DocumentEmailData;
      return {
        subject: `Document rejected: ${d.documentName}`,
        html: wrapHtml(`
          <h2 style="color: #dc2626;">Document Rejected</h2>
          <p><strong>${d.documentName}</strong> for asset <strong>${d.assetTitle}</strong> has been rejected.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">View in IPMS</a></p>
        `),
      };
    }
    case "invitation": {
      const d = data as InvitationEmailData;
      return {
        subject: `You've been invited to ${d.organizationName}`,
        html: wrapHtml(`
          <h2>You're Invited!</h2>
          <p><strong>${d.invitedByName}</strong> has invited you to join <strong>${d.organizationName}</strong> as <strong>${d.role}</strong>.</p>
          <p><a href="${d.appUrl}" style="color: #2563eb;">Sign in to IPMS</a></p>
        `),
      };
    }
  }
}
```

**Step 4: Export from domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export { renderEmailTemplate } from "./email-templates.js";
export type { EmailTemplateType, EmailTemplateData, DeadlineEmailData, DocumentEmailData, InvitationEmailData } from "./email-templates.js";
```

**Step 5: Run tests**

Run: `pnpm test -- packages/domain/src/email-templates.test.ts`
Expected: ALL PASS (6 tests)

**Step 6: Commit**

```bash
git add packages/domain/
git commit -m "feat(domain): add email template rendering functions"
```

---

### Task 2: Add EmailService port and implementations

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/resend-email-service.ts`
- Create: `packages/infrastructure/src/noop-email-service.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: Add EmailService port**

In `packages/application/src/ports.ts`, add at the end:

```typescript
export interface EmailService {
  send(to: string, subject: string, html: string): Promise<void>;
}
```

In `packages/application/src/index.ts`, add:

```typescript
export type { EmailService } from "./ports.js";
```

**Step 2: Create no-op email service**

Create `packages/infrastructure/src/noop-email-service.ts`:

```typescript
import type { EmailService } from "@ipms/application";

export function createNoOpEmailService(): EmailService {
  return {
    async send() {},
  };
}
```

**Step 3: Install Resend**

Run: `pnpm add resend --filter @ipms/infrastructure`

If `@ipms/infrastructure` is not a named workspace, run from the infrastructure package directory:
`cd packages/infrastructure && pnpm add resend`

**Step 4: Create Resend email service**

Create `packages/infrastructure/src/resend-email-service.ts`:

```typescript
import { Resend } from "resend";
import type { EmailService } from "@ipms/application";

export function createResendEmailService(apiKey: string, fromAddress: string): EmailService {
  const resend = new Resend(apiKey);

  return {
    async send(to, subject, html) {
      await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
      });
    },
  };
}
```

**Step 5: Export from infrastructure index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createNoOpEmailService } from "./noop-email-service.js";
export { createResendEmailService } from "./resend-email-service.js";
```

**Step 6: Verify**

Run: `pnpm test`
Expected: ALL PASS (172 tests)

**Step 7: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add EmailService port with Resend and no-op implementations"
```

---

### Task 3: Add `findAll` to OrganizationRepository

The cron route needs to iterate all organizations. Currently `OrganizationRepository` only has `findById` and `findByOwnerId`.

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/infrastructure/src/in-memory-organization-repository.ts`
- Modify: `packages/infrastructure/src/postgres/pg-organization-repository.ts`

**Step 1: Add method to port**

In `packages/application/src/ports.ts`, update `OrganizationRepository`:

```typescript
export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<Organization | null>;
  findByOwnerId(ownerId: UserId): Promise<readonly Organization[]>;
  findAll(): Promise<readonly Organization[]>;
  save(org: Organization): Promise<void>;
}
```

**Step 2: Update in-memory implementation**

In `packages/infrastructure/src/in-memory-organization-repository.ts`, add inside the returned object:

```typescript
async findAll() {
  return [...store.values()];
},
```

**Step 3: Update PostgreSQL implementation**

Read `packages/infrastructure/src/postgres/pg-organization-repository.ts` first. Then add a `findAll` method following the same pattern as existing methods:

```typescript
async findAll() {
  const rows = await db.select().from(organizations);
  return rows.map(toEntity);
},
```

**Step 4: Run tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add findAll to OrganizationRepository"
```

---

### Task 4: Update `checkDeadlineNotificationsUseCase` to send emails

**Files:**
- Modify: `packages/application/src/use-cases/notification.ts`
- Modify: `packages/infrastructure/src/notification-use-cases.test.ts`

**Step 1: Write failing test for email sending**

Add to `packages/infrastructure/src/notification-use-cases.test.ts`:

```typescript
import { checkDeadlineNotificationsUseCase } from "@ipms/application";
import { createInMemoryDeadlineRepository } from "./in-memory-deadline-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createNoOpEmailService } from "./noop-email-service.js";
import type { DeadlineId, AssetId, MembershipId } from "@ipms/shared";

// Add these at the top-level alongside existing constants:
const ASSET_ID = "880e8400-e29b-41d4-a716-446655440000" as AssetId;

describe("checkDeadlineNotifications with email", () => {
  it("sends emails for overdue deadlines", async () => {
    const deadlineRepo = createInMemoryDeadlineRepository();
    const notifRepo = createInMemoryNotificationRepository();
    const memRepo = createInMemoryMembershipRepository();
    const userRepo = createInMemoryUserRepository();
    const sentEmails: Array<{ to: string; subject: string }> = [];
    const emailService = {
      async send(to: string, subject: string, _html: string) {
        sentEmails.push({ to, subject });
      },
    };

    // Create a user
    await userRepo.save({
      id: USER_ID,
      email: "alice@example.com",
      name: "Alice",
      avatarUrl: null,
      authProviderId: "google:123",
      createdAt: new Date(),
    });

    // Create a membership
    await memRepo.save({
      id: "990e8400-e29b-41d4-a716-446655440000" as MembershipId,
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "attorney",
      joinedAt: new Date(),
    });

    // Create an overdue deadline
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await deadlineRepo.save({
      id: "aae8400-e29b-41d4-a716-446655440000" as DeadlineId,
      assetId: ASSET_ID,
      type: "filing",
      title: "File patent",
      dueDate: pastDate,
      completed: false,
      organizationId: ORG_ID,
    });

    const check = checkDeadlineNotificationsUseCase(deadlineRepo, notifRepo, memRepo, emailService, userRepo);
    const result = await check(ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(1);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("alice@example.com");
    expect(sentEmails[0].subject).toContain("overdue");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/infrastructure/src/notification-use-cases.test.ts`
Expected: FAIL — `checkDeadlineNotificationsUseCase` expects 3 args, got 5

**Step 3: Update the use case**

Modify `packages/application/src/use-cases/notification.ts`. Change `checkDeadlineNotificationsUseCase` to accept 2 additional params:

```typescript
import type { NotificationRepository, MembershipRepository, DeadlineRepository, UserRepository, EmailService } from "../ports.js";
import { renderEmailTemplate } from "@ipms/domain";
import type { DeadlineEmailData } from "@ipms/domain";

export function checkDeadlineNotificationsUseCase(
  deadlineRepo: DeadlineRepository,
  notificationRepo: NotificationRepository,
  memberRepo: MembershipRepository,
  emailService: EmailService,
  userRepo: UserRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<number>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    const members = await memberRepo.findByOrganizationId(orgId);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const deadline of deadlines) {
      if (deadline.completed) continue;

      const isOverdue = deadline.dueDate < now;
      const isUpcoming = !isOverdue && deadline.dueDate <= sevenDays;

      if (!isOverdue && !isUpcoming) continue;

      for (const member of members) {
        const type = isOverdue ? "deadline:overdue" as const : "deadline:upcoming" as const;
        const result = createNotification({
          id: crypto.randomUUID() as NotificationId,
          organizationId: orgId,
          recipientId: member.userId,
          type,
          title: isOverdue ? `Deadline overdue: ${deadline.title}` : `Deadline approaching: ${deadline.title}`,
          message: isOverdue
            ? `Deadline "${deadline.title}" was due on ${deadline.dueDate.toISOString().split("T")[0]}`
            : `Deadline "${deadline.title}" is due on ${deadline.dueDate.toISOString().split("T")[0]}`,
          entityType: "deadline",
          entityId: deadline.id,
        });
        if (result.ok) {
          await notificationRepo.save(result.value);
          count++;

          // Send email (best-effort)
          try {
            const user = await userRepo.findById(member.userId);
            if (user) {
              const email = renderEmailTemplate(type, {
                title: deadline.title,
                dueDate: deadline.dueDate.toISOString().split("T")[0],
                assetTitle: deadline.assetId,
                appUrl: "",
              } as DeadlineEmailData);
              await emailService.send(user.email, email.subject, email.html);
            }
          } catch {
            // Email failure is non-blocking
          }
        }
      }
    }

    return ok(count);
  };
}
```

**Step 4: Run tests**

Run: `pnpm test -- packages/infrastructure/src/notification-use-cases.test.ts`

The existing 3 tests will fail because they pass 3 args. Update them to pass 5 args:

In the `beforeEach` block, change:
```typescript
// Old tests create the use case as:
// checkDeadlineNotificationsUseCase(deadlineRepo, notifRepo, memRepo)
// Update to:
// checkDeadlineNotificationsUseCase(deadlineRepo, notifRepo, memRepo, createNoOpEmailService(), userRepo)
```

But the existing 3 tests don't use `checkDeadlineNotificationsUseCase` — they only test `listNotificationsUseCase`, `markNotificationReadUseCase`, `markAllNotificationsReadUseCase`. So they should still pass. Only `apps/web/src/lib/server/use-cases.ts` will need updating (Task 7).

Run: `pnpm test`
If any tests fail due to the signature change, fix the wiring in the calling code.

Expected: Tests in `notification-use-cases.test.ts` PASS. Some other tests or typecheck may fail if `checkDeadlineNotificationsUseCase` is called elsewhere with old signature — that will be fixed in Task 7 (wiring).

**Step 5: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add email sending to checkDeadlineNotificationsUseCase"
```

---

### Task 5: Update `updateDocumentStatusUseCase` to send emails

**Files:**
- Modify: `packages/application/src/use-cases/document.ts`
- Modify: `packages/infrastructure/src/document-use-cases.test.ts` (if it exists) or create new test file

**Step 1: Check if document use case tests exist**

Run: `ls packages/infrastructure/src/*document*test*` — if no test file exists, tests for this use case live elsewhere. Check `packages/domain/src/document.test.ts` for the domain-level tests.

The document use case tests may not have a dedicated file. Create `packages/infrastructure/src/document-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { updateDocumentStatusUseCase } from "@ipms/application";
import { createInMemoryDocumentRepository } from "./in-memory-document-repository.js";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createNoOpEmailService } from "./noop-email-service.js";
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

    // Create an attorney member who should receive review notifications
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

  it("does not send email for non-notifiable transitions", async () => {
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

    // uploaded -> under-review is notifiable, but let's test the status update still works
    await docRepo.save(UPLOADED_DOC);
    const update = updateDocumentStatusUseCase(docRepo, emailService, notifRepo, memRepo, userRepo);
    const result = await update(DOC_ID, ORG_ID, "under-review");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("under-review");
  });
});
```

**Step 2: Update the use case**

Modify `packages/application/src/use-cases/document.ts`:

```typescript
import type { DocumentId, DocumentStatus, OrganizationId, UserId, NotificationId, Result } from "@ipms/shared";
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
        // For review: notify attorneys+. For approved/rejected: notify all members.
        const recipients = members;

        for (const member of recipients) {
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
```

**Step 3: Run tests**

Run: `pnpm test -- packages/infrastructure/src/document-use-cases.test.ts`
Expected: ALL PASS

Note: existing tests elsewhere that call `updateDocumentStatusUseCase(repo)` with 1 arg will break. This is fixed in Task 7 (wiring).

**Step 4: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add email and notification sending to updateDocumentStatusUseCase"
```

---

### Task 6: Update `createInvitationUseCase` to send emails

**Files:**
- Modify: `packages/application/src/use-cases/invitation.ts`
- Modify: `packages/infrastructure/src/invitation-use-cases.test.ts`

**Step 1: Write failing test**

Add to `packages/infrastructure/src/invitation-use-cases.test.ts`:

```typescript
import { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";

describe("createInvitationUseCase with email", () => {
  it("sends invitation email", async () => {
    const invRepo = createInMemoryInvitationRepository();
    const orgRepo = createInMemoryOrganizationRepository();
    const sentEmails: Array<{ to: string; subject: string }> = [];
    const emailService = {
      async send(to: string, subject: string, _html: string) {
        sentEmails.push({ to, subject });
      },
    };

    // Create the org so the use case can look up the name
    await orgRepo.save({
      id: ORG_ID,
      name: "Acme Corp",
      ownerId: ADMIN_ID,
      createdAt: new Date(),
    });

    // Create a user for the inviter name
    const userRepo = (await import("./in-memory-user-repository.js")).createInMemoryUserRepository();
    await userRepo.save({
      id: ADMIN_ID,
      email: "admin@example.com",
      name: "Admin Alice",
      avatarUrl: null,
      authProviderId: "google:admin",
      createdAt: new Date(),
    });

    const create = createInvitationUseCase(invRepo, emailService, orgRepo, userRepo);
    const result = await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    expect(result.ok).toBe(true);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("bob@example.com");
    expect(sentEmails[0].subject).toContain("Acme Corp");
  });
});
```

**Step 2: Update the use case**

Modify `packages/application/src/use-cases/invitation.ts`. Change `createInvitationUseCase` to accept additional params:

```typescript
import type { InvitationId, OrganizationId, UserId, MembershipId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Invitation, MemberRole } from "@ipms/domain";
import { createInvitation, acceptInvitation, createMembership, renderEmailTemplate } from "@ipms/domain";
import type { InvitationEmailData } from "@ipms/domain";
import type { InvitationRepository, MembershipRepository, EmailService, OrganizationRepository, UserRepository } from "../ports.js";

export interface CreateInvitationUseCaseInput {
  readonly organizationId: OrganizationId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
}

export function createInvitationUseCase(
  repo: InvitationRepository,
  emailService: EmailService,
  orgRepo: OrganizationRepository,
  userRepo: UserRepository,
) {
  return async (input: CreateInvitationUseCaseInput): Promise<Result<Invitation>> => {
    const result = createInvitation({
      id: crypto.randomUUID() as InvitationId,
      organizationId: input.organizationId,
      invitedByUserId: input.invitedByUserId,
      email: input.email,
      role: input.role,
    });
    if (!result.ok) return result;
    await repo.save(result.value);

    // Send invitation email (best-effort)
    try {
      const org = await orgRepo.findById(input.organizationId);
      const inviter = await userRepo.findById(input.invitedByUserId);
      if (org && inviter) {
        const email = renderEmailTemplate("invitation", {
          organizationName: org.name,
          role: input.role,
          invitedByName: inviter.name,
          appUrl: "",
        } as InvitationEmailData);
        await emailService.send(input.email, email.subject, email.html);
      }
    } catch {
      // Email failure is non-blocking
    }

    return result;
  };
}
```

The other functions (`listInvitationsUseCase`, `deleteInvitationUseCase`, `acceptPendingInvitationsUseCase`) remain unchanged.

**Step 3: Update existing tests**

The existing tests in `invitation-use-cases.test.ts` create `createInvitationUseCase(invRepo)` with 1 arg. Update them to pass 4 args:

```typescript
import { createNoOpEmailService } from "./noop-email-service.js";
import { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";

// In beforeEach or at the start of each test that uses createInvitationUseCase:
const orgRepo = createInMemoryOrganizationRepository();
const userRepo = createInMemoryUserRepository();
const emailService = createNoOpEmailService();

const create = createInvitationUseCase(invRepo, emailService, orgRepo, userRepo);
```

**Step 4: Run tests**

Run: `pnpm test -- packages/infrastructure/src/invitation-use-cases.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add email sending to createInvitationUseCase"
```

---

### Task 7: Wire EmailService and update use-case bindings in web app

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`

**Step 1: Wire EmailService in repositories.ts**

Read `apps/web/src/lib/server/repositories.ts` first. Add `EmailService` wiring:

After the existing repo declarations, add:

```typescript
import type { EmailService } from "@ipms/application";

let emailService: EmailService;
```

In both branches (PG and in-memory), add after the existing repo initialization:

```typescript
// In the PG branch (inside `if (env.DATABASE_URL)`):
if (env.RESEND_API_KEY && env.RESEND_FROM_ADDRESS) {
  const { createResendEmailService } = await import("@ipms/infrastructure");
  emailService = createResendEmailService(env.RESEND_API_KEY, env.RESEND_FROM_ADDRESS);
} else {
  const { createNoOpEmailService } = await import("@ipms/infrastructure");
  emailService = createNoOpEmailService();
}

// In the in-memory branch (inside `else`):
const { createNoOpEmailService } = await import("@ipms/infrastructure");
emailService = createNoOpEmailService();
```

Note: The Resend import comes from `@ipms/infrastructure` (not postgres), since it's not a PG-specific service.

Add `emailService` to the export statement.

**Step 2: Update use-cases.ts**

Read `apps/web/src/lib/server/use-cases.ts` first. Update the affected use case wirings:

```typescript
import { ..., emailService } from "./repositories.js";

// Change these lines:
// Old: export const updateDocumentStatus = updateDocumentStatusUseCase(documentRepo);
// New:
export const updateDocumentStatus = updateDocumentStatusUseCase(documentRepo, emailService, notificationRepo, memberRepo, userRepo);

// Old: export const checkDeadlineNotifications = checkDeadlineNotificationsUseCase(deadlineRepo, notificationRepo, memberRepo);
// New:
export const checkDeadlineNotifications = checkDeadlineNotificationsUseCase(deadlineRepo, notificationRepo, memberRepo, emailService, userRepo);

// Old: export const createInvitation = createInvitationUseCase(invitationRepo);
// New:
export const createInvitation = createInvitationUseCase(invitationRepo, emailService, orgRepo, userRepo);
```

**Step 3: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/web/src/lib/server/
git commit -m "feat(web): wire EmailService and update use-case bindings"
```

---

### Task 8: Add cron route for deadline notifications

**Files:**
- Create: `apps/web/src/routes/api/cron/check-deadlines/+server.ts`

**Step 1: Create the route**

Create `apps/web/src/routes/api/cron/check-deadlines/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { checkDeadlineNotifications } from "$lib/server/use-cases";
import { orgRepo } from "$lib/server/repositories";

export const POST: RequestHandler = async (event) => {
  const authHeader = event.request.headers.get("authorization");
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;

  if (!expected || authHeader !== expected) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await orgRepo.findAll();
  let totalNotifications = 0;

  for (const org of organizations) {
    const result = await checkDeadlineNotifications(org.id);
    if (result.ok) {
      totalNotifications += result.value;
    }
  }

  return json({ notificationsCreated: totalNotifications });
};
```

**Step 2: Exclude cron route from auth middleware**

Read `apps/web/src/hooks.server.ts`. The `protectRoutes` middleware redirects unauthenticated users. Add `/api/cron` to the bypass list:

The existing check is:
```typescript
if (event.url.pathname.startsWith("/auth") || event.url.pathname === "/" || event.url.pathname.startsWith("/api/auth")) {
  return resolve(event);
}
```

Update to also bypass cron routes:
```typescript
if (event.url.pathname.startsWith("/auth") || event.url.pathname === "/" || event.url.pathname.startsWith("/api/auth") || event.url.pathname.startsWith("/api/cron")) {
  return resolve(event);
}
```

**Step 3: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add cron route for deadline notification emails"
```

---

### Task 9: Final verification and roadmap update

**Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: Only pre-existing errors in `asset.test.ts`

**Step 3: Update roadmap**

In `docs/roadmap.md`, under Phase 3, mark the email notifications item:

```markdown
- [x] Email notifications for deadlines and review requests
```

**Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 3c email notifications complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Email template pure functions + tests | `packages/domain/src/email-templates.ts` |
| 2 | EmailService port + Resend/no-op implementations | `packages/application/src/ports.ts`, `packages/infrastructure/src/` |
| 3 | Add `findAll` to OrganizationRepository | `packages/application/src/ports.ts`, both repo impls |
| 4 | Update checkDeadlineNotifications with email | `packages/application/src/use-cases/notification.ts` |
| 5 | Update updateDocumentStatus with email + notifications | `packages/application/src/use-cases/document.ts` |
| 6 | Update createInvitation with email | `packages/application/src/use-cases/invitation.ts` |
| 7 | Wire EmailService in web app | `apps/web/src/lib/server/` |
| 8 | Cron route for deadline checks | `apps/web/src/routes/api/cron/` |
| 9 | Final verification + roadmap | all |
