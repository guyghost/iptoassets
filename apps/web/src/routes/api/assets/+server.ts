import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listAssets, listAssetsFiltered, createAsset } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseFilterParams } from "$lib/server/parse-filter-params";
import { parseAssetId } from "@ipms/shared";
import type { AssetStatus } from "@ipms/shared";
import { assetRepo } from "$lib/server/repositories";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const filter = parseFilterParams(event.url);
  const result = filter
    ? await listAssetsFiltered(auth.value.organizationId, filter)
    : await listAssets(auth.value.organizationId);
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

  if (!result.ok) return resultToResponse(result, 201);

  // Apply optional import overrides (filing date, expiration date, status)
  let asset = result.value;
  if (body.filingDate || body.expirationDate || body.status) {
    asset = {
      ...asset,
      ...(body.filingDate ? { filingDate: new Date(body.filingDate) } : {}),
      ...(body.expirationDate ? { expirationDate: new Date(body.expirationDate) } : {}),
      ...(body.status ? { status: body.status as AssetStatus } : {}),
    };
    await assetRepo.save(asset);
  }

  return json(asset, { status: 201 });
};
