"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronLeft, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme/ThemeToggle";
import { useSessionUser } from "@/shared/auth/useSessionUser";

type TopbarProps = {
  userName?: string | null;
};

export function Topbar({ userName }: TopbarProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = useMemo(() => user?.name ?? userName ?? "Usuario", [user?.name, userName]);
  const profilePicUrl = user?.image ?? null;

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Veli Backoffice</span>
          <span className="text-lg font-semibold">Painel administrativo</span>
        </div>
      </div>
      <div className="relative flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground md:inline">{displayName}</span>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Abrir menu do usuario"
        >
          {profilePicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilePicUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </button>
        {isMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-border bg-card p-2 shadow-lg"
          >
            <div className="mb-2 border-b border-border px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/profile"
                role="menuitem"
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Meu perfil
              </Link>
              <div className="rounded-xl px-3 py-1.5">
                <ThemeToggle />
              </div>
              <button
                type="button"
                role="menuitem"
                className="rounded-xl px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
