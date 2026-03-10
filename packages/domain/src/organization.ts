import type { OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Organization } from "./entities.js";

export interface CreateOrganizationInput {
  readonly id: OrganizationId;
  readonly name: string;
  readonly ownerId: UserId;
}

export function createOrganization(input: CreateOrganizationInput): Result<Organization> {
  if (!input.name.trim()) return err("Organization name cannot be empty");

  return ok({
    id: input.id,
    name: input.name.trim(),
    ownerId: input.ownerId,
    createdAt: new Date(),
  });
}
