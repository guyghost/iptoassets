import type { AssetId, DeadlineId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import { type Deadline, type CreateDeadlineInput, createDeadline, completeDeadline } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository } from "../ports.js";

export function createDeadlineUseCase(repo: DeadlineRepository) {
  return async (
    input: CreateDeadlineInput,
  ): Promise<Result<Deadline>> => {
    const result = createDeadline(input);
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function listDeadlinesByAssetUseCase(repo: DeadlineRepository) {
  return async (
    assetId: AssetId,
    orgId: OrganizationId,
  ): Promise<Result<readonly Deadline[]>> => {
    const deadlines = await repo.findByAssetId(assetId, orgId);
    return ok(deadlines);
  };
}

export interface DeadlineWithAsset extends Deadline {
  readonly assetName: string;
}

export function listAllDeadlinesUseCase(repo: DeadlineRepository, assetRepo: AssetRepository) {
  return async (
    orgId: OrganizationId,
  ): Promise<Result<readonly DeadlineWithAsset[]>> => {
    const [deadlines, assets] = await Promise.all([
      repo.findAll(orgId),
      assetRepo.findAll(orgId),
    ]);
    const assetNames = new Map(assets.map((a) => [a.id, a.title]));
    const enriched = deadlines.map((d) => ({
      ...d,
      assetName: assetNames.get(d.assetId) ?? "Unknown asset",
    }));
    return ok(enriched);
  };
}

export function completeDeadlineUseCase(repo: DeadlineRepository) {
  return async (
    id: DeadlineId,
    orgId: OrganizationId,
  ): Promise<Result<Deadline>> => {
    const deadline = await repo.findById(id, orgId);
    if (!deadline) return err("Deadline not found");

    const result = completeDeadline(deadline);
    if (!result.ok) return result;

    await repo.save(result.value);
    return result;
  };
}
