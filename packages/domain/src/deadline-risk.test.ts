import { describe, it, expect } from "vitest";
import { computeDeadlineRisks } from "./deadline-risk.js";
import type { Deadline } from "./entities.js";
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;

function makeDeadline(id: string, dueDate: Date, completed = false): Deadline {
  return {
    id: id as DeadlineId,
    assetId: ASSET_ID,
    type: "renewal",
    title: "Test Deadline",
    dueDate,
    completed,
    organizationId: ORG_ID,
  };
}

const NOW = new Date("2026-03-11T00:00:00Z");

describe("computeDeadlineRisks", () => {
  it("returns score 0 for completed deadlines", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-12"), true)];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(0);
    expect(risks[0].factors).toEqual([]);
  });

  it("returns score 10 for overdue deadlines", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-10"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(10);
    expect(risks[0].factors).toContain("Deadline is overdue");
  });

  it("returns score 8 for deadlines due within 7 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-15"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(8);
    expect(risks[0].factors).toContain("Due within 7 days");
  });

  it("returns score 6 for deadlines due within 14 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-22"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(6);
  });

  it("returns score 1 for deadlines due in more than 60 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-06-01"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(1);
  });

  it("increases score for concurrent deadlines", () => {
    const deadlines = [
      makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-15")),
      makeDeadline("aae84000-e29b-41d4-a716-446655440002", new Date("2026-03-16")),
      makeDeadline("aae84000-e29b-41d4-a716-446655440003", new Date("2026-03-17")),
    ];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(10);
    expect(risks[0].factors).toContain("2 concurrent deadlines within 7-day window");
  });
});
