import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import TwitterProvider, { TwitterProfile } from "next-auth/providers/twitter";

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          scope: "tweet.read users.read",
        },
      },
      profile: async (profile: TwitterProfile) => {
        return {
          id: profile.data.id,
          username: profile.data.username,
          image: profile.data.profile_image_url?.replace("_normal", ""),
          name: profile.data.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, account, user }) => {
      if (account) {
        token.userId = account.providerAccountId;
        token.accessToken = account.access_token!;
        token.refreshToken = account.refresh_token!;
        token.expiresAt = account.expires_at!;
      }
      if (user) {
        token.user = user;
      }

      return token;
    },
    session: async ({ session, token }: { session: any; token: JWT }) => {
      session.userId = token.userId;
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expires_at = token.expiresAt;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
