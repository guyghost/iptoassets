import { signIn } from "../../auth";
import { env } from "$env/dynamic/private";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return {
    hasOAuthProviders: !!(env.GOOGLE_CLIENT_ID || env.MICROSOFT_ISSUER),
  };
};

export const actions: Actions = { default: signIn };
