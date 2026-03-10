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
