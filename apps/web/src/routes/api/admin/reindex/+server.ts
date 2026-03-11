import type { RequestHandler } from "./$types";
import { reindexAllAssets } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "org:manage");
  if (forbidden) return forbidden;

  const result = await reindexAllAssets(auth.value.organizationId);
  return resultToResponse(result);
};
