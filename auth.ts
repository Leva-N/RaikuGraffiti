import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Discord from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID ?? process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_DISCORD_SECRET ?? process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile && "id" in profile) {
        token.discordId = String(profile.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.discordId === "string" ? token.discordId : token.sub ?? "";
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
