import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { updateDocumentStatus, deleteDocument } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseDocumentId } from "@ipms/shared";

export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "document:update-status");
  if (forbidden) return forbidden;

  const { params, request } = event;
  const idResult = parseDocumentId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await request.json();
  const result = await updateDocumentStatus(idResult.value, auth.value.organizationId, body.status);
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "document:delete");
  if (forbidden) return forbidden;

  const { params } = event;
  const idResult = parseDocumentId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteDocument(idResult.value, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
