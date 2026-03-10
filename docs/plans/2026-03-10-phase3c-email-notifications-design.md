# Phase 3c: Email Notifications

## Overview

Add email notifications to IPMS using Resend. Extends the existing in-app notification system with email delivery for deadlines, document events, and member invitations.

## Decisions

- **Provider:** Resend (modern API, TypeScript SDK, free tier 100 emails/day)
- **Triggers:** All 5 notification types + invitations (6 total)
- **Deadline check:** External cron calling `POST /api/cron/check-deadlines` (daily)
- **Templates:** Pure functions with inline HTML, no template library
- **User preferences:** None for MVP (all members receive emails by role)
- **Error handling:** Best-effort — email failure does not block the in-app notification or invitation

---

## 1. EmailService Port

```typescript
export interface EmailService {
  send(to: string, subject: string, html: string): Promise<void>;
}
```

Two implementations:
- `createResendEmailService(apiKey, fromAddress)` — production, uses `resend` npm package
- `createNoOpEmailService()` — tests and dev (no RESEND_API_KEY)

---

## 2. Email Templates

Pure domain functions in `packages/domain/src/email-templates.ts`:

```typescript
renderEmailTemplate(type: NotificationType | "invitation", data: EmailTemplateData): { subject: string; html: string }
```

6 templates:

| Type | Subject | Recipients |
|------|---------|------------|
| `deadline:upcoming` | Deadline approaching: {title} | All org members |
| `deadline:overdue` | Deadline overdue: {title} | All org members |
| `document:review` | Document ready for review: {name} | Attorneys+ in org |
| `document:approved` | Document approved: {name} | Document creator |
| `document:rejected` | Document rejected: {name} | Document creator |
| `invitation` | You've been invited to {orgName} | Invited email |

Simple HTML with inline styles for email client compatibility. Testable unitarily.

---

## 3. Use Case Changes

### checkDeadlineNotificationsUseCase

Additional params: `EmailService`, `UserRepository`.

After creating each in-app notification, resolves member email via `userRepo.findById()`, renders template, sends email. Email errors are caught and ignored (best-effort).

### updateDocumentStatusUseCase

Additional params: `EmailService`, `NotificationRepository`, `MembershipRepository`, `UserRepository`.

On status change to `in_review`, `approved`, or `rejected`: creates in-app notification AND sends email to appropriate recipients.

### createInvitationUseCase

Additional params: `EmailService`, `OrganizationRepository`.

After creating the invitation, sends email to the invited address with org name and assigned role.

---

## 4. Cron Route

`POST /api/cron/check-deadlines`

- Protected by `Authorization: Bearer {CRON_SECRET}` header (not RBAC — machine-to-machine)
- Iterates all organizations, runs `checkDeadlineNotifications` for each
- Returns count of notifications created

---

## 5. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No | Resend API key. If absent, no-op email service used |
| `RESEND_FROM_ADDRESS` | No | Sender address (e.g. `notifications@ipms.app`) |
| `CRON_SECRET` | No | Shared secret for cron endpoint auth |

---

## 6. New Dependencies

- `resend` npm package (infrastructure layer)

---

## Changes to Existing Code

- `checkDeadlineNotificationsUseCase` gains `EmailService` + `UserRepository` params
- `updateDocumentStatusUseCase` gains `EmailService` + `NotificationRepository` + `MembershipRepository` + `UserRepository` params
- `createInvitationUseCase` gains `EmailService` + `OrganizationRepository` params
- `repositories.ts` wires `EmailService` (Resend or no-op based on env)
- `use-cases.ts` rewires affected use cases with `emailService`

## Out of Scope

- User email preferences / opt-out
- Email retry queue
- React Email templates
- Email tracking / open rates
