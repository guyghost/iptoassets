import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";

let _db: any;

async function getDb() {
  if (!_db) {
    if (env.DATABASE_URL) {
      const { createDatabase } = await import("@ipms/infrastructure/postgres");
      _db = createDatabase(env.DATABASE_URL);
    }
  }
  return _db;
}

export const auth = betterAuth({
  database: drizzleAdapter(await getDb(), { provider: "pg" }),
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:5173",
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(env.MICROSOFT_CLIENT_ID && {
      microsoft: {
        clientId: env.MICROSOFT_CLIENT_ID!,
        clientSecret: env.MICROSOFT_CLIENT_SECRET!,
        issuer: env.MICROSOFT_ISSUER,
      },
    }),
  },
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.path === "/sign-in/social",
        handler: async (ctx) => {
          const user = (ctx as any).context?.session?.user;
          if (!user?.email || !user?.name) return;

          const { signInOrRegister, acceptPendingInvitations } =
            await import("$lib/server/use-cases");

          const result = await signInOrRegister({
            authProviderId: `better-auth:${user.id}`,
            email: user.email,
            name: user.name,
            avatarUrl: user.image ?? null,
          });

          if (result.ok) {
            await acceptPendingInvitations(user.email, result.value.id);
          }
        },
      },
    ],
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});
