import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listAllDeadlines, completeDeadline } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseDeadlineId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "deadline:read");
  if (forbidden) return forbidden;

  const result = await listAllDeadlines(auth.value.organizationId);
  return resultToResponse(result);
};

export const PATCH: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "deadline:complete");
  if (forbidden) return forbidden;

  const body = await event.request.json();
  const idResult = parseDeadlineId(body.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await completeDeadline(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
