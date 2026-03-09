import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listPortfolios, createPortfolio } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async () => {
  const result = await listPortfolios(DEFAULT_ORG_ID);
  return resultToResponse(result);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const idResult = parsePortfolioId(body.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await createPortfolio({
    id: idResult.value,
    name: body.name,
    description: body.description ?? "",
    owner: body.owner,
    organizationId: DEFAULT_ORG_ID,
  });

  return resultToResponse(result, 201);
};
