import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { updateDocumentStatus, deleteDocument } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseDocumentId } from "@ipms/shared";

export const PUT: RequestHandler = async ({ params, request }) => {
  const idResult = parseDocumentId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await request.json();
  const result = await updateDocumentStatus(idResult.value, DEFAULT_ORG_ID, body.status);
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const idResult = parseDocumentId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteDocument(idResult.value, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
