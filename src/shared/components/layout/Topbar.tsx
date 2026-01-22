"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/shared/components/theme/ThemeToggle";
import { Button } from "@/shared/components/ui/button";

type TopbarProps = {
  userName?: string | null;
};

export function Topbar({ userName }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Veli Backoffice</span>
        <span className="text-lg font-semibold">Painel administrativo</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{userName ?? "Usuario"}</span>
        <ThemeToggle />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sair
        </Button>
      </div>
    </header>
  );
}
