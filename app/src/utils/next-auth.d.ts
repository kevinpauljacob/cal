import NextAuth, { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

declare module "next-auth" {
  // Extend the User type
  interface User extends DefaultUser {
    id: string;
    username?: string;
  }

  // Extend the Session type
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken: string;
    refreshToken: string;
    expires_at: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
}
