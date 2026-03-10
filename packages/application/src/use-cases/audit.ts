import type { AuditEventId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { AuditEvent, AuditAction, EntityType } from "@ipms/domain";
import { createAuditEvent } from "@ipms/domain";
import type { AuditEventRepository } from "../ports.js";

export interface LogAuditInput {
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata?: Record<string, string> | null;
}

export function logAuditEventUseCase(repo: AuditEventRepository) {
  return async (input: LogAuditInput): Promise<Result<AuditEvent>> => {
    const result = createAuditEvent({
      id: crypto.randomUUID() as AuditEventId,
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? null,
    });
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function listAuditEventsUseCase(repo: AuditEventRepository) {
  return async (
    orgId: OrganizationId,
    options?: { entityType?: string; actorId?: UserId; limit?: number },
  ): Promise<Result<readonly AuditEvent[]>> => {
    const events = await repo.findByOrganizationId(orgId, options);
    return ok(events);
  };
}
