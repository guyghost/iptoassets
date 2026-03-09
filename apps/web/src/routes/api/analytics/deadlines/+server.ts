import type { RequestHandler } from "./$types";
import { computeDeadlineMetrics } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";

export const GET: RequestHandler = async () => {
  const result = await computeDeadlineMetrics(DEFAULT_ORG_ID, new Date());
  return resultToResponse(result);
};
