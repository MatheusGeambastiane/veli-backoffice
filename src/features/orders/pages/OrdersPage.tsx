"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { useOrdersList } from "@/features/orders/queries/ordersQueries";
import type { OrderListItem, OrderPreferencePeriod } from "@/features/orders/types/order";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DataSurface, PageHeader, PageStat, PageToolbar } from "@/shared/components/ui/page";
import { cn } from "@/shared/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "waiting_payment", label: "Aguardando pagamento" },
  { value: "active", label: "Ativo" },
  { value: "paid", label: "Pago" },
  { value: "canceled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
] as const;

const ENROLLMENT_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "false", label: "Com enturmação" },
  { value: "true", label: "Sem enturmação" },
] as const;

const PERIOD_OPTIONS: Array<{ value: OrderPreferencePeriod; label: string }> = [
  { value: "morning", label: "Manhã" },
  { value: "afternoon", label: "Tarde" },
  { value: "night", label: "Noite" },
  { value: "no_preference", label: "Sem preferência" },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const STATUS_LABELS: Record<string, string> = {
  waiting_payment: "Aguardando pagamento",
  active: "Ativo",
  paid: "Pago",
  canceled: "Cancelado",
  expired: "Expirado",
};

const DAY_LABELS: Record<string, string> = {
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sab",
  Sun: "Dom",
};

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

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return currencyFormatter.format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function formatDays(days: string[]) {
  return days.map((day) => DAY_LABELS[day] ?? day).join(", ") || "-";
}

function toStartOfDay(value: string) {
  return value ? `${value}T00:00:00-03:00` : undefined;
}

function toEndOfDay(value: string) {
  return value ? `${value}T23:59:59-03:00` : undefined;
}

function statusLabel(value: string) {
  return STATUS_LABELS[value] ?? value;
}

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isGenericFilter, setIsGenericFilter] = useState<"" | "true" | "false">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [preferencePeriods, setPreferencePeriods] = useState<OrderPreferencePeriod[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const deferredSearch = useDeferredValue(search.trim());

  const { data, isLoading, isError, isFetching } = useOrdersList({
    search: deferredSearch || undefined,
    status: status || undefined,
    isGeneric: isGenericFilter ? isGenericFilter === "true" : undefined,
    preferencePeriod: preferencePeriods.length ? preferencePeriods : undefined,
    createdAtFrom: toStartOfDay(dateFrom),
    createdAtTo: toEndOfDay(dateTo),
    page,
    pageSize,
  });

  const orders = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const nextPageFromApi = parsePageFromUrl(data?.next ?? null);
  const previousPageFromApi = parsePageFromUrl(data?.previous ?? null);
  const canGoPrevious = previousPageFromApi !== null || page > 1;
  const canGoNext = nextPageFromApi !== null || page < totalPages;

  const pageLabel = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    return `Página ${safePage} de ${totalPages}`;
  }, [page, totalPages]);

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  function togglePreferencePeriod(period: OrderPreferencePeriod) {
    setPreferencePeriods((current) =>
      current.includes(period) ? current.filter((item) => item !== period) : [...current, period],
    );
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setIsGenericFilter("");
    setDateFrom("");
    setDateTo("");
    setPreferencePeriods([]);
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
      <PageHeader
        title="Pedidos"
        description="Acompanhe pedidos, pagamentos e preferências de turma dos alunos."
        actions={<PageStat label="Total" value={totalCount} />}
      />

      <PageToolbar>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px_170px_170px_auto] xl:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Busca</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nome, email ou CPF"
                className="h-11 pl-9"
                aria-label="Buscar pedidos por nome, email ou CPF"
              />
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              aria-label="Filtrar por status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Enturmação</span>
            <select
              value={isGenericFilter}
              onChange={(event) => {
                setIsGenericFilter(event.target.value as "" | "true" | "false");
                setPage(1);
              }}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              aria-label="Filtrar por enturmação"
            >
              {ENROLLMENT_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Data inicial</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="h-11"
              aria-label="Filtrar data inicial"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Data final</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="h-11"
              aria-label="Filtrar data final"
            />
          </label>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button type="button" variant="outline" className="h-11" onClick={clearFilters}>
              <Filter className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => {
            const isSelected = preferencePeriods.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => togglePreferencePeriod(option.value)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </PageToolbar>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PaginationBar
          pageLabel={pageLabel}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
          isFetching={isFetching}
        />

        <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          <span className="text-xs font-medium">Itens por página</span>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            aria-label="Selecionar itens por página"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataSurface>
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-4 border-b border-border/80 bg-muted/20 px-6 py-4 text-xs font-medium text-muted-foreground xl:grid">
          <span>Aluno</span>
          <span>Status</span>
          <span>Turma</span>
          <span>Valor</span>
          <span>Criado em</span>
        </div>

        {isLoading && (
          <div className="space-y-3 px-6 py-6">
            <div className="h-20 animate-pulse rounded-md bg-muted" />
            <div className="h-20 animate-pulse rounded-md bg-muted" />
            <div className="h-20 animate-pulse rounded-md bg-muted" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="px-6 py-8 text-sm text-destructive">Erro ao carregar pedidos.</div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado para os filtros atuais.
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
          <ul className="divide-y divide-border/80">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </DataSurface>

      <PaginationBar
        pageLabel={pageLabel}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        isFetching={isFetching}
      />
    </section>
  );
}

function OrderRow({ order }: { order: OrderListItem }) {
  const classPreference = order.class_preference;

  return (
    <li className="grid gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] xl:items-center">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground xl:hidden">Aluno</p>
        <p className="truncate text-sm font-semibold text-foreground">{order.user.full_name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{order.user.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">CPF: {order.user.cpf ?? "-"}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground xl:hidden">Status</p>
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-medium",
            order.status === "active"
              ? "bg-success/10 text-success"
              : order.status === "waiting_payment"
                ? "bg-warning/15 text-warning-foreground"
                : "bg-muted text-muted-foreground",
          )}
        >
          {statusLabel(order.status)}
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          {order.billing_option?.name ?? "Sem opção de cobrança"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground xl:hidden">Turma</p>
        {classPreference ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {classPreference.course_name}
              </p>
              {classPreference.is_generic && (
                <span className="shrink-0 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                  Genérica
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {classPreference.time.slice(0, 5)} - {classPreference.duration} min
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDays(classPreference.days_of_week)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sem preferência</p>
        )}
      </div>

      <DataCell label="Valor" value={formatCurrency(order.offer_price)} />
      <DataCell label="Criado em" value={formatDateTime(order.created_at)} />
    </li>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm text-muted-foreground">
      <p className="text-xs font-medium text-muted-foreground xl:hidden">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function PaginationBar({
  pageLabel,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  isFetching,
}: {
  pageLabel: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>{pageLabel}</span>
        {isFetching && <span className="text-xs">Atualizando...</span>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={!canGoNext}>
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
