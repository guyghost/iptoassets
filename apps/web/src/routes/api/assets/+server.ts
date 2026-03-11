import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listAssets, createAsset } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const result = await listAssets(auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:create");
  if (forbidden) return forbidden;

  const { request } = event;
  const body = await request.json();

  const idResult = parseAssetId(body.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await createAsset({
    id: idResult.value,
    title: body.title,
    type: body.type,
    jurisdiction: body.jurisdiction,
    owner: body.owner,
    organizationId: auth.value.organizationId,
    metadata: body.metadata ?? null,
  });

  return resultToResponse(result, 201);
};
