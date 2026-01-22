"use client";

import { useSession } from "next-auth/react";

export function useSessionUser() {
  const { data, status } = useSession();
  return {
    user: data?.user,
    status,
    isAuthenticated: status === "authenticated",
  };
}
