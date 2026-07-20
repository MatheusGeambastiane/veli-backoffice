import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname === "/login") {
    for (const cookieName of AUTH_COOKIE_NAMES) {
      response.cookies.delete(cookieName);
    }
  }

  return response;
}

export const config = {
  matcher: ["/login"],
};
