import type { RequestHandler } from "./$types";
import { exportAssetsCSV } from "$lib/server/use-cases";
import { requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import type { AssetFilter } from "@ipms/domain";
import type { AssetStatus, IPType } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "export:csv");
  if (forbidden) return forbidden;

  const { url } = event;
  const status = url.searchParams.getAll("status");
  const type = url.searchParams.getAll("type");
  const jurisdiction = url.searchParams.get("jurisdiction");
  const owner = url.searchParams.get("owner");

  const assetFilter: AssetFilter = {
    ...(status.length > 0 ? { status: status as AssetStatus[] } : {}),
    ...(type.length > 0 ? { type: type as IPType[] } : {}),
    ...(jurisdiction ? { jurisdiction } : {}),
    ...(owner ? { owner } : {}),
  };

  const result = await exportAssetsCSV(auth.value.organizationId, assetFilter);
  if (!result.ok) return new Response(result.error, { status: 400 });

  return new Response(result.value, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="assets.csv"',
    },
  });
};
