"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Sparkles, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme/ThemeToggle";
import { useSessionUser } from "@/shared/auth/useSessionUser";

type TopbarProps = {
  userName?: string | null;
  variant?: "default" | "assistant";
};

export function Topbar({ userName, variant = "default" }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSessionUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const displayName = useMemo(() => user?.name ?? userName ?? "Usuário", [user?.name, userName]);
  const profilePicUrl = user?.image ?? null;
  const isAssistant = variant === "assistant";
  const lessonModuleMatch = pathname.match(/^\/courses\/modules\/([^/]+)\/lessons\/[^/]+/);
  const lessonModuleHref = lessonModuleMatch ? `/courses/modules/${lessonModuleMatch[1]}` : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current || !event.target) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={[
        "flex shrink-0 items-center justify-between border-b border-border bg-card",
        isAssistant ? "h-16 px-4 sm:px-6" : "px-6 py-4",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {isAssistant ? (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-[-0.015em]">Herminho</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">
                Análise inteligente. Somente leitura.
              </span>
            </div>
          </>
        ) : (
          <>
            {lessonModuleHref ? (
              <Link
                href={lessonModuleHref}
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para módulo
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Veli Backoffice</span>
              <span className="text-lg font-semibold">Painel administrativo</span>
            </div>
          </>
        )}
      </div>
      <div className="relative flex items-center gap-3" ref={menuRef}>
        <ThemeToggle />
        <span className="hidden text-sm text-muted-foreground sm:inline">{displayName}</span>
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Abrir menu do usuário"
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
            className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            <div className="mb-2 border-b border-border px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/profile"
                role="menuitem"
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Meu perfil
              </Link>
              <button
                type="button"
                role="menuitem"
                className="rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
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
