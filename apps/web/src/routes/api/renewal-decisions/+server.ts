import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { listRenewalDecisions } from "$lib/server/use-cases";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:read");
  if (forbidden) return forbidden;

  const result = await listRenewalDecisions(auth.value.organizationId);
  return resultToResponse(result);
};
