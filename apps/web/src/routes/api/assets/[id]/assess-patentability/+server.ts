import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { assessPatentability } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await event.request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "text is required" }, { status: 400 });

  const result = await assessPatentability(idResult.value, auth.value.organizationId, text);
  return resultToResponse(result);
};
