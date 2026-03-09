import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listDeadlinesByAsset, createDeadline } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseAssetId, parseDeadlineId } from "@ipms/shared";

export const GET: RequestHandler = async ({ params }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await listDeadlinesByAsset(idResult.value, DEFAULT_ORG_ID);
  return resultToResponse(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
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
    organizationId: DEFAULT_ORG_ID,
  });

  return resultToResponse(result, 201);
};
