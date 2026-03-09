import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createDocument } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseDocumentId, parseAssetId } from "@ipms/shared";

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const docIdResult = parseDocumentId(body.id);
  if (!docIdResult.ok) return json({ error: docIdResult.error }, { status: 400 });

  const assetIdResult = parseAssetId(body.assetId);
  if (!assetIdResult.ok) return json({ error: assetIdResult.error }, { status: 400 });

  const result = await createDocument({
    id: docIdResult.value,
    assetId: assetIdResult.value,
    name: body.name,
    type: body.type,
    url: body.url,
    organizationId: DEFAULT_ORG_ID,
  });

  return resultToResponse(result, 201);
};
