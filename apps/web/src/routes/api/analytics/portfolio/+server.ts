import type { RequestHandler } from "./$types";
import { computePortfolioMetrics } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await computePortfolioMetrics(auth.value.organizationId, new Date());
  return resultToResponse(result);
};
