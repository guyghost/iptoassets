import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { getPortfolioFinancials } from "$lib/server/use-cases";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:read");
  if (forbidden) return forbidden;

  const idResult = parsePortfolioId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getPortfolioFinancials(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
