import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getPortfolio, deletePortfolio } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:read");
  if (forbidden) return forbidden;

  const { params } = event;
  const idResult = parsePortfolioId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getPortfolio(idResult.value, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:delete");
  if (forbidden) return forbidden;

  const { params } = event;
  const idResult = parsePortfolioId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deletePortfolio(idResult.value, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
