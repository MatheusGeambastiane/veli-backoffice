"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Home,
  Layers3,
  Megaphone,
  MoreHorizontal,
  Sparkles,
  ShoppingCart,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/assistant", label: "Assistente", icon: Sparkles },
  { href: "/users", label: "Usuários", icon: Users },
  { href: "/courses", label: "Cursos", icon: GraduationCap },
  { href: "/classes", label: "Turmas", icon: BookOpen },
];

const financialItems: NavItem[] = [
  { href: "/billing", label: "Faturamento", icon: BadgeDollarSign },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/offers", label: "Ofertas", icon: Layers3 },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
];
const mobilePrimaryItems = navItems.slice(0, 4);
const mobileMoreItems = [...navItems.slice(4), ...financialItems];

function releasePointerFocus(event: MouseEvent<HTMLAnchorElement>) {
  if (event.detail > 0) {
    event.currentTarget.blur();
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const isAssistantPage = pathname.startsWith("/assistant");

  return (
    <>
      <aside className="group/sidebar absolute inset-y-0 left-0 z-30 hidden w-20 flex-col overflow-hidden border-r border-border bg-card px-3 py-6 shadow-[8px_0_24px_-24px_rgba(15,23,42,0.5)] transition-[width,box-shadow] duration-200 ease-out hover:w-64 hover:shadow-[16px_0_36px_-28px_rgba(15,23,42,0.45)] focus-within:w-64 focus-within:shadow-[16px_0_36px_-28px_rgba(15,23,42,0.45)] lg:flex">
        <div className="relative mb-6 h-10 shrink-0">
          <div className="absolute inset-y-0 left-2 h-10 w-10 overflow-hidden rounded-md opacity-100 transition-opacity duration-150 group-hover/sidebar:opacity-0 group-focus-within/sidebar:opacity-0">
            <Image
              src="/Veli_simbolo fundo azul escuro.png"
              alt="Veli"
              fill
              className="rounded-md object-contain"
              sizes="40px"
              priority
            />
          </div>
          <div className="absolute inset-y-0 left-2 h-10 w-[73px] overflow-hidden rounded-md opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
            <Image
              src="/Veli_logo fundo azul médio.png"
              alt="Veli"
              fill
              className="rounded-md object-contain"
              sizes="73px"
              priority
            />
          </div>
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
                onClick={releasePointerFocus}
                className={[
                  "group flex min-h-11 items-center gap-0 rounded-md px-[18px] text-sm font-medium transition-[background-color,color,gap] group-hover/sidebar:gap-3 group-focus-within/sidebar:gap-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                ].join(" ")}
                title={item.label}
              >
                {item.href === "/assistant" ? (
                  <span className="relative h-5 w-5 shrink-0 overflow-hidden" aria-hidden="true">
                    <Image
                      src="/herminho_outlier.png"
                      alt=""
                      fill
                      sizes="20px"
                      className="scale-[1.8] object-contain"
                    />
                  </span>
                ) : (
                  <Icon className="h-5 w-5 shrink-0" />
                )}
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-150 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-40 group-focus-within/sidebar:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="mt-4 space-y-2">
            <div className="flex h-10 items-center gap-0 overflow-hidden px-[18px] text-xs font-medium text-muted-foreground transition-[gap] group-hover/sidebar:gap-3 group-focus-within/sidebar:gap-3">
              <BriefcaseBusiness className="h-5 w-5 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-150 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-40 group-focus-within/sidebar:opacity-100">
                Financeiro
              </span>
            </div>

            {financialItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={releasePointerFocus}
                  className={[
                    "group flex min-h-11 items-center gap-0 rounded-md px-[18px] text-sm font-medium transition-[background-color,color,gap] group-hover/sidebar:gap-3 group-focus-within/sidebar:gap-3",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  ].join(" ")}
                  title={item.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex max-w-0 flex-1 items-center overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-150 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 group-focus-within/sidebar:max-w-40 group-focus-within/sidebar:opacity-100">
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {!isAssistantPage && (
        <>
          {isMobileMoreOpen ? (
            <div
              className="fixed inset-0 z-30 bg-foreground/15 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsMobileMoreOpen(false)}
            >
              <div
                className="absolute inset-x-3 bottom-24 rounded-xl border border-border bg-card p-3 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold">Mais áreas</p>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setIsMobileMoreOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {mobileMoreItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMoreOpen(false)}
                        className={[
                          "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <nav className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 lg:hidden">
            <div className="grid w-full max-w-[560px] grid-cols-5 items-center rounded-xl border border-border/70 bg-card/95 p-2 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.5)] backdrop-blur-xl">
              {mobilePrimaryItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-[10px] font-medium transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                    aria-label={item.label}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                        isActive
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-transparent bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {item.href === "/assistant" ? (
                        <span className="relative h-5 w-5 overflow-hidden" aria-hidden="true">
                          <Image
                            src="/herminho_outlier.png"
                            alt=""
                            fill
                            sizes="20px"
                            className="scale-[1.8] object-contain"
                          />
                        </span>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen((current) => !current)}
                className={[
                  "flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-[10px] font-medium transition-colors",
                  isMobileMoreOpen || mobileMoreItems.some((item) => pathname.startsWith(item.href))
                    ? "text-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
                aria-expanded={isMobileMoreOpen}
                aria-label="Abrir mais áreas"
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                    isMobileMoreOpen ||
                    mobileMoreItems.some((item) => pathname.startsWith(item.href))
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </span>
                <span>Mais</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
