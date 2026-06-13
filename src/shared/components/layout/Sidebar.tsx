"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import {
  BriefcaseBusiness,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Home,
  Layers3,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/courses", label: "Cursos", icon: GraduationCap },
  { href: "/classes", label: "Turmas", icon: BookOpen },
];

const financialItems: NavItem[] = [
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/offers", label: "Ofertas", icon: Layers3 },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
];
const mobileNavItems = [...navItems, ...financialItems];

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <aside
        className={[
          "hidden h-full flex-col border-r border-border bg-card/95 py-6 shadow-sm transition-[width] duration-300 md:flex",
          isCollapsed ? "w-20 px-3" : "w-64 px-4",
        ].join(" ")}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-15 w-15 overflow-hidden rounded-2xl">
              <Image
                src="/Veli_simbolo azul escuro sem fundo.png"
                alt="Veli"
                fill
                className="object-contain p-1.5"
                sizes="44px"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={`${poppins.className} veli-logo-text text-xl font-semibold tracking-wide`}>
                  Veli
                </span>
                {/* <span className="text-xs text-muted-foreground">Backoffice</span> */}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center rounded-2xl text-sm font-medium transition-all",
                  isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                ].join(" ")}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={isCollapsed ? "h-5 w-5" : "h-4 w-4"} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <div className="mt-4 space-y-2">
            {!isCollapsed ? (
              <div className="px-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Financeiro
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
                  <BriefcaseBusiness className="h-4 w-4" />
                </span>
              </div>
            )}

            {financialItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "group flex items-center rounded-2xl text-sm font-medium transition-all",
                    isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  ].join(" ")}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={isCollapsed ? "h-5 w-5" : "h-4 w-4"} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 md:hidden">
        <div className="flex w-full max-w-[460px] items-center justify-between rounded-full border border-border/60 bg-card px-4 py-2.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]">
          {mobileNavItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1 py-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                aria-label={item.label}
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
