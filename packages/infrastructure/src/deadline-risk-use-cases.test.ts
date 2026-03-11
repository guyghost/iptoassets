import { describe, it, expect } from "vitest";
import { computeDeadlineRiskUseCase } from "@ipms/application";
import { createInMemoryDeadlineRepository } from "./in-memory-deadline-repository.js";
import type { DeadlineId, AssetId, OrganizationId } from "@ipms/shared";
import type { Deadline } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

describe("computeDeadlineRiskUseCase", () => {
  it("computes risk scores for all deadlines in org", async () => {
    const repo = createInMemoryDeadlineRepository();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deadline: Deadline = {
      id: "aae84000-e29b-41d4-a716-446655440001" as DeadlineId,
      assetId: "bbe84000-e29b-41d4-a716-446655440001" as AssetId,
      type: "renewal",
      title: "Patent Renewal",
      dueDate: tomorrow,
      completed: false,
      organizationId: ORG_ID,
    };
    await repo.save(deadline);

    const compute = computeDeadlineRiskUseCase(repo);
    const result = await compute(ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].score).toBeGreaterThan(0);
    }
  });
});
