import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { createOrg, listUserOrganizations } from "$lib/server/use-cases";

export const load: PageServerLoad = async (event) => {
  const userId = event.locals.userId;
  if (!userId) throw redirect(303, "/login");

  const orgsResult = await listUserOrganizations(userId);
  if (orgsResult.ok && orgsResult.value.length > 0) {
    throw redirect(303, "/app");
  }
};

export const actions: Actions = {
  default: async (event) => {
    const userId = event.locals.userId;
    if (!userId) throw redirect(303, "/login");

    const formData = await event.request.formData();
    const name = formData.get("name") as string;

    const result = await createOrg({ name, ownerId: userId });
    if (!result.ok) {
      return { error: result.error };
    }

    throw redirect(303, "/app");
  },
};
