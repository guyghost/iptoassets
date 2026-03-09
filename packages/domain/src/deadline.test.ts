import { describe, it, expect } from "vitest";
import { createDeadline, completeDeadline } from "./deadline.js";
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;
const DEADLINE_ID = "770e8400-e29b-41d4-a716-446655440000" as DeadlineId;

describe("createDeadline", () => {
  it("creates a deadline with valid input", () => {
    const result = createDeadline({
      id: DEADLINE_ID,
      assetId: ASSET_ID,
      type: "renewal",
      title: "Annual Renewal",
      dueDate: new Date("2026-06-01"),
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("Annual Renewal");
      expect(result.value.completed).toBe(false);
    }
  });

  it("rejects empty title", () => {
    const result = createDeadline({
      id: DEADLINE_ID,
      assetId: ASSET_ID,
      type: "renewal",
      title: "",
      dueDate: new Date(),
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(false);
  });
});

describe("completeDeadline", () => {
  it("completes an incomplete deadline", () => {
    const created = createDeadline({
      id: DEADLINE_ID,
      assetId: ASSET_ID,
      type: "renewal",
      title: "Test",
      dueDate: new Date(),
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const result = completeDeadline(created.value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.completed).toBe(true);
    }
  });

  it("rejects completing an already completed deadline", () => {
    const created = createDeadline({
      id: DEADLINE_ID,
      assetId: ASSET_ID,
      type: "renewal",
      title: "Test",
      dueDate: new Date(),
      organizationId: ORG_ID,
    });
    if (!created.ok) return;

    const completed = completeDeadline(created.value);
    if (!completed.ok) return;

    const result = completeDeadline(completed.value);
    expect(result.ok).toBe(false);
  });
});
