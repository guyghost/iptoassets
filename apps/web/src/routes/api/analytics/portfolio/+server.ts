import type { RequestHandler } from "./$types";
import { computePortfolioMetrics } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseFilterParams } from "$lib/server/parse-filter-params";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const filter = parseFilterParams(event.url);
  const result = await computePortfolioMetrics(auth.value.organizationId, new Date(), filter);
  return resultToResponse(result);
};
