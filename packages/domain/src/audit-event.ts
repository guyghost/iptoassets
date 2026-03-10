import type { AuditEventId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { AuditEvent, AuditAction, EntityType } from "./entities.js";

export interface CreateAuditEventInput {
  readonly id: AuditEventId;
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata: Record<string, string> | null;
}

export function createAuditEvent(input: CreateAuditEventInput): Result<AuditEvent> {
  return ok({ ...input, timestamp: new Date() });
}
