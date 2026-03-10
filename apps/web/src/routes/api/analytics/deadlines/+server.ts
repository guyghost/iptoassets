import type { RequestHandler } from "./$types";
import { computeDeadlineMetrics } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "deadline:read");
  if (forbidden) return forbidden;

  const result = await computeDeadlineMetrics(auth.value.organizationId, new Date());
  return resultToResponse(result);
};
