import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { renewalFeeRepo } from "$lib/server/repositories";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-fee:read");
  if (forbidden) return forbidden;

  const jurisdiction = event.url.searchParams.get("jurisdiction");
  const fees = jurisdiction
    ? await renewalFeeRepo.findByJurisdiction(jurisdiction)
    : await renewalFeeRepo.findAll();
  return json(fees);
};
