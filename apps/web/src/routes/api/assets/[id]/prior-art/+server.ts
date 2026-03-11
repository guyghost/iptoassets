import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchPriorArt, listPriorArt } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await listPriorArt(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  let keywords: string | undefined;
  try {
    const body = await event.request.json();
    if (typeof body.keywords === "string" && body.keywords.trim()) {
      keywords = body.keywords.trim();
    }
  } catch {
    // No body or invalid JSON — that's fine, keywords are optional
  }

  const result = await searchPriorArt(idResult.value, auth.value.organizationId, keywords);
  return resultToResponse(result);
};
