import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { bulkAddAssetsToPortfolio } from "$lib/server/use-cases";
import { requireAuth, unauthorizedResponse } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";
import type { AssetId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const { request } = event;
  const body = await request.json();
  const portfolioIdResult = parsePortfolioId(body.portfolioId);
  if (!portfolioIdResult.ok) return json({ error: portfolioIdResult.error }, { status: 400 });

  const assetIds = (body.ids as string[]).map((id) => id as AssetId);
  const result = await bulkAddAssetsToPortfolio(portfolioIdResult.value, assetIds, auth.value.organizationId);
  if (!result.ok) return json({ error: result.error }, { status: 400 });
  return json(result.value);
};
