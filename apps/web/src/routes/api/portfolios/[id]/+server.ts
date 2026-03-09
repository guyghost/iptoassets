import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getPortfolio, deletePortfolio } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async ({ params }) => {
  const idResult = parsePortfolioId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getPortfolio(idResult.value, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const idResult = parsePortfolioId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deletePortfolio(idResult.value, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 404 });
  return resultToResponse(result);
};
