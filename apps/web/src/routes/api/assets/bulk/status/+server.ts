import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { bulkUpdateAssetStatus } from "$lib/server/use-cases";
import { DEFAULT_ORG_ID } from "$lib/server/api-utils";
import type { AssetId } from "@ipms/shared";

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const ids = (body.ids as string[]).map((id) => id as AssetId);
  const result = await bulkUpdateAssetStatus(ids, DEFAULT_ORG_ID, body.status, body.changedBy ?? "system");
  if (!result.ok) return json({ error: result.error }, { status: 400 });
  return json(result.value);
};
