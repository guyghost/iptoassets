import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { bulkUpdateAssetStatus } from "$lib/server/use-cases";
import { requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import type { AssetId } from "@ipms/shared";

export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "bulk:operate");
  if (forbidden) return forbidden;

  const { request } = event;
  const body = await request.json();
  const ids = (body.ids as string[]).map((id) => id as AssetId);
  const result = await bulkUpdateAssetStatus(ids, auth.value.organizationId, body.status, body.changedBy ?? auth.value.userId);
  if (!result.ok) return json({ error: result.error }, { status: 400 });
  return json(result.value);
};
