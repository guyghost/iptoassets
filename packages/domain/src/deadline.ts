import type { AssetId, DeadlineId, DeadlineType, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Deadline } from "./entities.js";

export interface CreateDeadlineInput {
  readonly id: DeadlineId;
  readonly assetId: AssetId;
  readonly type: DeadlineType;
  readonly title: string;
  readonly dueDate: Date;
  readonly organizationId: OrganizationId;
}

export function createDeadline(input: CreateDeadlineInput): Result<Deadline> {
  if (!input.title.trim()) {
    return err("Deadline title cannot be empty");
  }

  return ok({
    id: input.id,
    assetId: input.assetId,
    type: input.type,
    title: input.title.trim(),
    dueDate: input.dueDate,
    completed: false,
    organizationId: input.organizationId,
  });
}

export function completeDeadline(deadline: Deadline): Result<Deadline> {
  if (deadline.completed) {
    return err("Deadline is already completed");
  }
  return ok({ ...deadline, completed: true });
}
