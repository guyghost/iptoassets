import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { classifyDocument } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseDocumentId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "document:update-status");
  if (forbidden) return forbidden;

  const idResult = parseDocumentId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await classifyDocument(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
