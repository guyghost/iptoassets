import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listAssets, createAsset } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async () => {
  const result = await listAssets(DEFAULT_ORG_ID);
  return resultToResponse(result);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const idResult = parseAssetId(body.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await createAsset({
    id: idResult.value,
    title: body.title,
    type: body.type,
    jurisdiction: body.jurisdiction,
    owner: body.owner,
    organizationId: DEFAULT_ORG_ID,
  });

  return resultToResponse(result, 201);
};
