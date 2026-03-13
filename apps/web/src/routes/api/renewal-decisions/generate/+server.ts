import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { generateRenewalDecisions } from "$lib/server/use-cases";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:write");
  if (forbidden) return forbidden;

  const result = await generateRenewalDecisions(auth.value.organizationId);
  return resultToResponse(result);
};
