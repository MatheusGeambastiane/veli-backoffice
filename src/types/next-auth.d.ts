import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }

  interface User {
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    profilePicUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    profilePicUrl?: string | null;
    error?: string;
  }
}
