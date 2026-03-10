import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import MicrosoftEntraId from "@auth/sveltekit/providers/microsoft-entra-id";
import { env } from "$env/dynamic/private";

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  const { signInOrRegister, listUserOrganizations } = await import("$lib/server/use-cases");
  const { userRepo } = await import("$lib/server/repositories");

  return {
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
      MicrosoftEntraId({
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        issuer: env.MICROSOFT_ISSUER,
      }),
    ],
    callbacks: {
      async signIn({ user, account }) {
        if (!account || !user.email || !user.name) return false;

        const result = await signInOrRegister({
          authProviderId: `${account.provider}:${account.providerAccountId}`,
          email: user.email,
          name: user.name,
          avatarUrl: user.image ?? null,
        });

        return result.ok;
      },
      async session({ session }) {
        if (!session.user?.email) return session;

        const domainUser = await userRepo.findByEmail(session.user.email);
        if (domainUser) {
          (session as any).userId = domainUser.id;

          const orgsResult = await listUserOrganizations(domainUser.id);
          if (orgsResult.ok && orgsResult.value.length > 0) {
            (session as any).activeOrganizationId = orgsResult.value[0].id;
          }
        }

        return session;
      },
    },
    trustHost: true,
  };
});
