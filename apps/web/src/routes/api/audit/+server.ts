import type { RequestHandler } from "./$types";
import { listAuditEvents } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "audit:read");
  if (forbidden) return forbidden;

  const { url } = event;
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : undefined;

  const result = await listAuditEvents(auth.value.organizationId, { entityType, limit });
  return resultToResponse(result);
};
