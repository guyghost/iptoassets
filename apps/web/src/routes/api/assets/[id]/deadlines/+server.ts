import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listDeadlinesByAsset, createDeadline } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse } from "$lib/server/api-utils";
import { parseAssetId, parseDeadlineId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const { params } = event;
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await listDeadlinesByAsset(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const { params, request } = event;
  const assetIdResult = parseAssetId(params.id);
  if (!assetIdResult.ok) return json({ error: assetIdResult.error }, { status: 400 });

  const body = await request.json();
  const deadlineIdResult = parseDeadlineId(body.id);
  if (!deadlineIdResult.ok) return json({ error: deadlineIdResult.error }, { status: 400 });

  const result = await createDeadline({
    id: deadlineIdResult.value,
    assetId: assetIdResult.value,
    type: body.type,
    title: body.title,
    dueDate: new Date(body.dueDate),
    organizationId: auth.value.organizationId,
  });

  return resultToResponse(result, 201);
};
