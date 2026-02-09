"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Filter } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@/shared/components/ui/input";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useClassesList } from "@/features/classes/queries/classesQueries";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function ClassesPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const { status } = useSession();

  const { data, isLoading, isError, isFetching } = useClassesList({
    search: deferredSearch || undefined,
    is_active: activeFilter || undefined,
    page_size: pageSize,
  });
  const isAuthLoading = status === "loading";
  const showLoading = isAuthLoading || isLoading;

  const filterLabel = useMemo(() => {
    if (activeFilter === "true") return "Ativas";
    if (activeFilter === "false") return "Inativas";
    return "Todas";
  }, [activeFilter]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Turmas</h1>
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} turma{data?.count === 1 ? "" : "s"} cadastrada
            {data?.count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
              onClick={() => setIsFilterOpen((current) => !current)}
              aria-label="Filtrar turmas"
              aria-expanded={isFilterOpen}
              aria-haspopup="menu"
            >
              <Filter className="h-4 w-4" />
              {filterLabel}
            </Button>
            {isFilterOpen && (
              <div
                className="absolute left-0 top-12 z-20 w-48 rounded-2xl border border-border bg-card p-2 shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === ""
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("true");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === "true"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Ativas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("false");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === "false"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Inativas
                </button>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide">Itens por página</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
              aria-label="Selecionar page size"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative w-full max-w-[80%]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar turma"
            className="h-11 rounded-2xl"
            aria-label="Buscar turma"
          />
        </div>
      </div>

      {showLoading && (
        <div className="rounded-3xl border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Carregando turmas...
        </div>
      )}

      {!showLoading && isError && (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 px-6 py-6 text-sm text-destructive">
          Erro ao carregar turmas.
        </div>
      )}

      {!showLoading && !isError && data && (
        <div className="space-y-4">
          {isFetching && (
            <p className="text-xs font-medium text-primary">Atualizando resultados...</p>
          )}
          {data?.results.length ? (
            <ul className="grid gap-4 lg:grid-cols-2">
              {data.results.map((item) => (
                <li
                  key={item.id}
                  className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.language_icon_url ? (
                        <img
                          src={item.language_icon_url}
                          alt={item.course_name}
                          className="h-12 w-12 rounded-2xl border border-border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl border border-border bg-muted" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.course_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Professora: {item.teacher_full_name ?? "Nao informado"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        item.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Periodo</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.start_date} - {item.finish_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Horario</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.time} • {item.duration} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Dias</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.days_of_week.join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Alunos</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.total_students}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/classes/${item.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground">
              Nenhuma turma encontrada para os filtros atuais.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
