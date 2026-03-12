import { env } from "$env/dynamic/private";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return {
    hasGoogle: !!env.GOOGLE_CLIENT_ID,
    hasMicrosoft: !!env.MICROSOFT_CLIENT_ID,
  };
};
