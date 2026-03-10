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
