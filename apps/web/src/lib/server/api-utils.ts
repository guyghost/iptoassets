import { json } from "@sveltejs/kit";
import type { Result } from "@ipms/shared";

export function resultToResponse<T>(result: Result<T>, status = 200) {
  if (result.ok) {
    return json(result.value, { status });
  }
  return json({ error: result.error }, { status: 400 });
}

export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001" as import("@ipms/shared").OrganizationId;
