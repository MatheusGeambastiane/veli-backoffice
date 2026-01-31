"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { useDashboardUsersList } from "@/features/users/queries/usersQueries";
import type {
  DashboardLanguage,
  DashboardUser,
  DashboardUserRoleFilter,
} from "@/features/users/types/dashboardUser";
import { Input } from "@/shared/components/ui/input";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

type RoleOption = {
  label: string;
  value: "all" | DashboardUserRoleFilter;
};

const ROLE_OPTIONS: RoleOption[] = [
  { label: "Todos", value: "all" },
  { label: "Professores", value: "teatcher" },
  { label: "Estudantes", value: "student" },
  { label: "Gerentes", value: "manager" },
];

function parsePageFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const page = parsed.searchParams.get("page");
    return page ? Number(page) : null;
  } catch {
    return null;
  }
}

function getFullName(user: DashboardUser) {
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return fullName || user.username || user.email;
}

function getLanguageMeta(language: DashboardLanguage | string) {
  if (typeof language === "string") {
    return {
      key: language,
      label: language,
      image: null,
    };
  }
  return {
    key: String(language.id ?? language.code ?? language.name ?? "language"),
    label: language.name ?? language.code ?? "Idioma",
    image: language.lang_icon ?? language.flag ?? language.image ?? null,
  };
}

export function UsersListPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleOption["value"]>("all");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  const roleParam = role === "all" ? undefined : role;

  const { data, isLoading, isError, isFetching } = useDashboardUsersList({
    search: deferredSearch ? deferredSearch : undefined,
    role: roleParam,
    pageSize,
    page,
  });

  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const nextPageFromApi = parsePageFromUrl(data?.next ?? null);
  const previousPageFromApi = parsePageFromUrl(data?.previous ?? null);

  const users = data?.results ?? [];

  const pageLabel = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    return `Pagina ${safePage} de ${totalPages}`;
  }, [page, totalPages]);

  const canGoPrevious = previousPageFromApi !== null || page > 1;
  const canGoNext = nextPageFromApi !== null || page < totalPages;

  function handleRoleChange(nextRole: RoleOption["value"]) {
    setRole(nextRole);
    setPage(1);
  }

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!canGoPrevious) return;
    setPage((current) => Math.max(1, previousPageFromApi ?? current - 1));
  }

  function goToNextPage() {
    if (!canGoNext) return;
    setPage((current) => Math.min(totalPages, nextPageFromApi ?? current + 1));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Gestao de acessos</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Busque, filtre e acompanhe o time ativo.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UsersIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="text-lg font-semibold text-foreground">{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, email ou telefone"
            className="h-11 rounded-2xl border-border bg-card pl-9 shadow-sm"
            aria-label="Buscar usuarios"
          />
        </div>
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <span className="text-xs uppercase tracking-wide">Page size</span>
            <select
              value={pageSize}
              onChange={(event) => handlePageSizeChange(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
              aria-label="Selecionar tamanho da pagina"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((option) => {
          const isActive = option.value === role;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleRoleChange(option.value)}
              className={[
                "rounded-2xl border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary/20 bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <UsersPagination
        page={page}
        totalPages={totalPages}
        pageLabel={pageLabel}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={goToNextPage}
        onPrevious={goToPreviousPage}
        isFetching={isFetching}
      />

      <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto_auto] gap-3 border-b border-border/80 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Usuario</span>
          <span>Telefone</span>
          <span>Email</span>
          <span>Perfil</span>
          <span>Idiomas</span>
          <span className="text-right">Acoes</span>
        </div>

        {isLoading && (
          <div className="space-y-3 px-5 py-6">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {isError && (
          <div className="px-5 py-6 text-sm text-destructive">Erro ao carregar usuarios.</div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum usuario encontrado para os filtros atuais.
          </div>
        )}

        {!isLoading && !isError && users.length > 0 && (
          <ul className="divide-y divide-border/80">
            {users.map((user) => (
              <UsersRow key={user.id} user={user} />
            ))}
          </ul>
        )}
      </div>

      <UsersPagination
        page={page}
        totalPages={totalPages}
        pageLabel={pageLabel}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={goToNextPage}
        onPrevious={goToPreviousPage}
        isFetching={isFetching}
      />
    </section>
  );
}

type UsersPaginationProps = {
  page: number;
  totalPages: number;
  pageLabel: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isFetching: boolean;
};

function UsersPagination({
  page,
  totalPages,
  pageLabel,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  isFetching,
}: UsersPaginationProps) {
  const safePage = Math.min(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {pageLabel}
        {isFetching && <span className="ml-2 text-xs text-primary">Atualizando...</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <div className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">
          {safePage}/{totalPages}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proxima
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UsersRow({ user }: { user: DashboardUser }) {
  const fullName = getFullName(user);
  const languages = user.languages ?? [];

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto_auto] lg:items-center lg:gap-3">
        <Link href={`/users/${user.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar src={user.profile_pic} name={fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.username}</p>
          </div>
        </Link>

        <div className="text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-wide text-muted-foreground/80 lg:hidden">
            Telefone
          </span>
          <p className="truncate text-foreground">{user.phone ?? "-"}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-wide text-muted-foreground/80 lg:hidden">
            Email
          </span>
          <p className="truncate text-foreground">{user.email}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {user.role}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {languages.length === 0 && <span className="text-xs text-muted-foreground">Sem idiomas</span>}
          {languages.slice(0, 4).map((language) => {
            const meta = getLanguageMeta(language);
            return <LanguageBadge key={meta.key} label={meta.label} image={meta.image} />;
          })}
          {languages.length > 4 && (
            <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
              +{languages.length - 4}
            </span>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href={`/users/${user.id}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={`Abrir perfil de ${fullName}`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="h-12 w-12 rounded-2xl object-cover" />;
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
      {initial || "U"}
    </div>
  );
}

function LanguageBadge({ label, image }: { label: string; image: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={label}
        title={label}
        className="h-8 w-8 rounded-full border border-border/70 object-cover"
      />
    );
  }

  const initial = label.charAt(0).toUpperCase();
  return (
    <span
      title={label}
      className="flex h-8 min-w-8 items-center justify-center rounded-full border border-border px-2 text-xs font-semibold text-foreground"
    >
      {initial || "I"}
    </span>
  );
}
