import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAssetTimeline } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async ({ params }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getAssetTimeline(idResult.value, DEFAULT_ORG_ID);
  return resultToResponse(result);
};
