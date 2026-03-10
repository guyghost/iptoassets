import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAsset, updateAssetStatus, deleteAsset } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const { params } = event;
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getAsset(idResult.value, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};

export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:update-status");
  if (forbidden) return forbidden;

  const { params, request } = event;
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await request.json();
  const result = await updateAssetStatus(idResult.value, auth.value.organizationId, body.status, body.changedBy ?? auth.value.userId);
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:delete");
  if (forbidden) return forbidden;

  const { params } = event;
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteAsset(idResult.value, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
