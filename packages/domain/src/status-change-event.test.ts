import { describe, it, expect } from "vitest";
import { createStatusChangeEvent } from "./status-change-event.js";
import type { CreateStatusChangeEventInput } from "./status-change-event.js";
import type { AssetId, OrganizationId, StatusChangeEventId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;
const EVENT_ID = "770e8400-e29b-41d4-a716-446655440000" as StatusChangeEventId;

const validInput: CreateStatusChangeEventInput = {
  id: EVENT_ID,
  assetId: ASSET_ID,
  fromStatus: "draft",
  toStatus: "filed",
  changedBy: "Alex Chen",
  organizationId: ORG_ID,
};

describe("createStatusChangeEvent", () => {
  it("creates an event with valid input", () => {
    const result = createStatusChangeEvent(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assetId).toBe(ASSET_ID);
      expect(result.value.fromStatus).toBe("draft");
      expect(result.value.toStatus).toBe("filed");
      expect(result.value.changedBy).toBe("Alex Chen");
      expect(result.value.changedAt).toBeInstanceOf(Date);
    }
  });

  it("allows null fromStatus for initial creation", () => {
    const result = createStatusChangeEvent({ ...validInput, fromStatus: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromStatus).toBeNull();
      expect(result.value.toStatus).toBe("filed");
    }
  });

  it("rejects empty changedBy", () => {
    const result = createStatusChangeEvent({ ...validInput, changedBy: "  " });
    expect(result).toEqual({ ok: false, error: "changedBy cannot be empty" });
  });
});
