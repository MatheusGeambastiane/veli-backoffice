import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

type LoginResponse = {
  refresh: string;
  access: string;
  token?: string;
  role?: string;
  full_name?: string;
  profile_pic_url?: string | null;
};

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf-8");
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return {};
  }
}

async function refreshAccessToken(token: JWT) {
  try {
    if (!token.refreshToken) {
      throw new Error("Missing refresh token");
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: token.refreshToken }),
      }
    );

    if (!response.ok) {
      throw new Error("Refresh token failed");
    }

    const data = (await response.json()) as LoginResponse;
    const accessToken = data.access ?? token.accessToken;
    const payload = decodeJwtPayload(accessToken as string);

    return {
      ...token,
      accessToken,
      refreshToken: data.refresh ?? token.refreshToken,
      accessTokenExpires: payload.exp ? payload.exp * 1000 : undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Senha", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password) {
      return null;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/auth/login/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const detail =
        payload?.detail ||
        payload?.message ||
        "Email ou senha invalidos.";
      throw new Error(detail);
    }

    const data = (await response.json()) as LoginResponse;
    const payload = decodeJwtPayload(data.access);

    return {
      id: "user-1",
      name: data.full_name ?? "Usuario",
      email: credentials.email,
      role: data.role ?? "admin",
      accessToken: data.access,
      refreshToken: data.refresh,
      accessTokenExpires: payload.exp ? payload.exp * 1000 : undefined,
      profilePicUrl: data.profile_pic_url ?? null,
    };
  },
});

const googleProviderEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  providers: [
    credentialsProvider,
    ...(googleProviderEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as {
          role?: string;
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpires?: number;
          profilePicUrl?: string | null;
        };
        token.role = typedUser.role ?? "admin";
        token.accessToken = typedUser.accessToken;
        token.refreshToken = typedUser.refreshToken;
        token.accessTokenExpires = typedUser.accessTokenExpires;
        token.profilePicUrl = typedUser.profilePicUrl;
        return token;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 5_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
        session.user.image = (token.profilePicUrl as string | null | undefined) ?? null;
      }
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
