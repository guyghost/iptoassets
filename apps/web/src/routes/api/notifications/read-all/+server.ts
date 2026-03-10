import type { RequestHandler } from "./$types";
import { markAllNotificationsRead } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse } from "$lib/server/api-utils";

export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await markAllNotificationsRead(auth.value.userId, auth.value.organizationId);
  return resultToResponse(result);
};
