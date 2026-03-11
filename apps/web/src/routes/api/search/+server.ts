import type { RequestHandler } from "./$types";
import { searchAssets } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const query = event.url.searchParams.get("q") ?? "";
  if (!query.trim()) return resultToResponse({ ok: true, value: [] });

  const limit = event.url.searchParams.has("limit") ? Number(event.url.searchParams.get("limit")) : 20;
  const result = await searchAssets(auth.value.organizationId, query, limit);
  return resultToResponse(result);
};
