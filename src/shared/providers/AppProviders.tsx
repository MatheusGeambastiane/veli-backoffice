"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { createQueryClient } from "@/shared/lib/queryClient";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
