import { describe, it, expect } from "vitest";
import { computeDeadlineMetrics } from "./deadline-metrics.js";
import type { Deadline } from "../entities.js";
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeDeadline = (overrides: Partial<Deadline>): Deadline => ({
  id: "d0000000-0000-0000-0000-000000000001" as DeadlineId,
  assetId: "a0000000-0000-0000-0000-000000000001" as AssetId,
  type: "renewal",
  title: "Test Deadline",
  dueDate: new Date("2026-03-15"),
  completed: false,
  organizationId: ORG_ID,
  ...overrides,
});

describe("computeDeadlineMetrics", () => {
  const now = new Date("2026-03-09");

  it("returns zero counts for empty array", () => {
    const metrics = computeDeadlineMetrics([], now);
    expect(metrics.total).toBe(0);
    expect(metrics.overdue).toBe(0);
    expect(metrics.upcoming).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.completionRate).toBe(0);
  });

  it("counts overdue deadlines (past due, not completed)", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ dueDate: new Date("2026-03-01"), completed: true }),
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdue).toBe(1);
  });

  it("counts upcoming deadlines (due within 30 days, not completed)", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: false }),
      makeDeadline({ dueDate: new Date("2026-03-20"), completed: false }),
      makeDeadline({ dueDate: new Date("2026-05-01"), completed: false }),
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: true }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.upcoming).toBe(2);
  });

  it("calculates completion rate", () => {
    const deadlines = [
      makeDeadline({ completed: true }),
      makeDeadline({ completed: true }),
      makeDeadline({ completed: false }),
      makeDeadline({ completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.completionRate).toBe(0.5);
  });

  it("counts overdue by type", () => {
    const deadlines = [
      makeDeadline({ type: "renewal", dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ type: "renewal", dueDate: new Date("2026-03-02"), completed: false }),
      makeDeadline({ type: "response", dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ type: "filing", dueDate: new Date("2026-03-15"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdueByType.renewal).toBe(2);
    expect(metrics.overdueByType.response).toBe(1);
    expect(metrics.overdueByType.filing).toBe(0);
  });

  it("treats deadline due exactly today as not overdue", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-09"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdue).toBe(0);
    expect(metrics.upcoming).toBe(1);
  });
});
