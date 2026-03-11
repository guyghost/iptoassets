import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { DeadlineRisk } from "@ipms/domain";
import { computeDeadlineRisks } from "@ipms/domain";
import type { DeadlineRepository } from "../ports.js";

export function computeDeadlineRiskUseCase(deadlineRepo: DeadlineRepository) {
  return async (orgId: OrganizationId): Promise<Result<readonly DeadlineRisk[]>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    const risks = computeDeadlineRisks(deadlines);
    return ok(risks);
  };
}
