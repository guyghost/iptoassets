import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { markNotificationRead } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse } from "$lib/server/api-utils";
import { parseNotificationId } from "@ipms/shared";

export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const idResult = parseNotificationId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await markNotificationRead(idResult.value, auth.value.userId);
  return resultToResponse(result);
};
