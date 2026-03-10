import { describe, it, expect, beforeEach } from "vitest";
import { logAuditEventUseCase, listAuditEventsUseCase } from "@ipms/application";
import { createInMemoryAuditEventRepository } from "./in-memory-audit-event-repository.js";
import type { OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

describe("audit use cases", () => {
  let repo: ReturnType<typeof createInMemoryAuditEventRepository>;

  beforeEach(() => { repo = createInMemoryAuditEventRepository(); });

  it("logs and lists audit events", async () => {
    const log = logAuditEventUseCase(repo);
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:create", entityType: "asset", entityId: "123" });
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:delete", entityType: "asset", entityId: "456" });

    const list = listAuditEventsUseCase(repo);
    const result = await list(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });

  it("filters by entityType", async () => {
    const log = logAuditEventUseCase(repo);
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:create", entityType: "asset", entityId: "1" });
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "document:create", entityType: "document", entityId: "2" });

    const list = listAuditEventsUseCase(repo);
    const result = await list(ORG_ID, { entityType: "document" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });
});
