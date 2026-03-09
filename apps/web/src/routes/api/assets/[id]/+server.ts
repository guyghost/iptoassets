import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAsset, updateAssetStatus, deleteAsset } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async ({ params }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getAsset(idResult.value, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await request.json();
  const result = await updateAssetStatus(idResult.value, DEFAULT_ORG_ID, body.status, body.changedBy ?? "System");
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteAsset(idResult.value, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
