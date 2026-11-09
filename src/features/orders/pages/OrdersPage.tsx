"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useDeleteOrder, useOrdersList } from "@/features/orders/queries/ordersQueries";
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

function billingOptionLabel(code?: string | null) {
  if (!code) return "Sem opção de cobrança";

  const paymentMethod = code.includes("CREDIT_CARD")
    ? "Cartão de crédito"
    : code.includes("PIX")
      ? "Pix"
      : null;
  const cadence = code.startsWith("UPFRONT_")
    ? "cobrança única"
    : code.startsWith("MONTHLY_")
      ? "mensal"
      : code.startsWith("QUARTERLY_")
        ? "trimestral"
        : code.startsWith("SEMI_ANNUAL_")
          ? "semestral"
          : code.startsWith("ANNUAL_")
            ? "anual"
            : null;

  if (paymentMethod && cadence) return `${paymentMethod} · ${cadence}`;
  if (paymentMethod) return paymentMethod;
  return code.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
}

type OrdersListState = {
  search: string;
  status: string;
  isGenericFilter: "" | "true" | "false";
  dateFrom: string;
  dateTo: string;
  preferencePeriods: OrderPreferencePeriod[];
  page: number;
  pageSize: number;
};

function buildOrdersListPath(state: OrdersListState) {
  const params = new URLSearchParams();
  if (state.search) params.set("search", state.search);
  if (state.status) params.set("status", state.status);
  if (state.isGenericFilter) params.set("is_generic", state.isGenericFilter);
  if (state.dateFrom) params.set("date_from", state.dateFrom);
  if (state.dateTo) params.set("date_to", state.dateTo);
  state.preferencePeriods.forEach((period) => params.append("preference_period", period));
  if (state.page > 1) params.set("page", String(state.page));
  if (state.pageSize !== 20) params.set("page_size", String(state.pageSize));
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGeneric = searchParams.get("is_generic");
  const initialPeriods = searchParams
    .getAll("preference_period")
    .filter((period): period is OrderPreferencePeriod =>
      PERIOD_OPTIONS.some((option) => option.value === period),
    );
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [isGenericFilter, setIsGenericFilter] = useState<"" | "true" | "false">(() =>
    initialGeneric === "true" || initialGeneric === "false" ? initialGeneric : "",
  );
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("date_to") ?? "");
  const [preferencePeriods, setPreferencePeriods] = useState<OrderPreferencePeriod[]>(initialPeriods);
  const [page, setPage] = useState(() => positiveInteger(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState<number>(() =>
    positiveInteger(searchParams.get("page_size"), 20),
  );
  const [deleteTarget, setDeleteTarget] = useState<OrderListItem | null>(null);
  const deleteOrder = useDeleteOrder();
  const deferredSearch = useDeferredValue(search.trim());

  const listState: OrdersListState = {
    search,
    status,
    isGenericFilter,
    dateFrom,
    dateTo,
    preferencePeriods,
    page,
    pageSize,
  };
  const returnPath = buildOrdersListPath(listState);

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

  function persistListState(overrides: Partial<OrdersListState>) {
    router.replace(buildOrdersListPath({ ...listState, ...overrides }), { scroll: false });
  }

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
    persistListState({ pageSize: nextSize, page: 1 });
  }

  function togglePreferencePeriod(period: OrderPreferencePeriod) {
    const nextPeriods = preferencePeriods.includes(period)
      ? preferencePeriods.filter((item) => item !== period)
      : [...preferencePeriods, period];
    setPreferencePeriods(nextPeriods);
    setPage(1);
    persistListState({ preferencePeriods: nextPeriods, page: 1 });
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setIsGenericFilter("");
    setDateFrom("");
    setDateTo("");
    setPreferencePeriods([]);
    setPage(1);
    router.replace("/orders", { scroll: false });
  }

  function goToPreviousPage() {
    if (!canGoPrevious) return;
    const nextPage = Math.max(1, previousPageFromApi ?? page - 1);
    setPage(nextPage);
    persistListState({ page: nextPage });
  }

  function goToNextPage() {
    if (!canGoNext) return;
    const nextPage = Math.min(totalPages, nextPageFromApi ?? page + 1);
    setPage(nextPage);
    persistListState({ page: nextPage });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteOrder.mutateAsync(String(deleteTarget.id));
      if (orders.length === 1 && page > 1) {
        const previousPage = page - 1;
        setPage(previousPage);
        persistListState({ page: previousPage });
      }
      setDeleteTarget(null);
    } catch {
      // The mutation state renders the contextual error in the confirmation dialog.
    }
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
                  const nextSearch = event.target.value;
                  setSearch(nextSearch);
                  setPage(1);
                  persistListState({ search: nextSearch, page: 1 });
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
                const nextStatus = event.target.value;
                setStatus(nextStatus);
                setPage(1);
                persistListState({ status: nextStatus, page: 1 });
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
                const nextGeneric = event.target.value as "" | "true" | "false";
                setIsGenericFilter(nextGeneric);
                setPage(1);
                persistListState({ isGenericFilter: nextGeneric, page: 1 });
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
                const nextDate = event.target.value;
                setDateFrom(nextDate);
                setPage(1);
                persistListState({ dateFrom: nextDate, page: 1 });
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
                const nextDate = event.target.value;
                setDateTo(nextDate);
                setPage(1);
                persistListState({ dateTo: nextDate, page: 1 });
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

      <DataSurface className="overflow-visible">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_48px] gap-4 border-b border-border/80 bg-muted/20 px-6 py-4 text-xs font-medium text-muted-foreground xl:grid">
          <span>Aluno</span>
          <span>Status</span>
          <span>Turma</span>
          <span>Valor</span>
          <span>Criado em</span>
          <span className="text-center">Ações</span>
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
              <OrderRow
                key={order.id}
                order={order}
                returnPath={returnPath}
                onDelete={() => {
                  deleteOrder.reset();
                  setDeleteTarget(order);
                }}
              />
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

      {deleteTarget && (
        <DeleteOrderDialog
          order={deleteTarget}
          isPending={deleteOrder.isPending}
          isError={deleteOrder.isError}
          onClose={() => {
            if (!deleteOrder.isPending) {
              deleteOrder.reset();
              setDeleteTarget(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

function OrderRow({
  order,
  returnPath,
  onDelete,
}: {
  order: OrderListItem;
  returnPath: string;
  onDelete: () => void;
}) {
  const classPreference = order.class_preference;
  const detailsHref = `/orders/${order.id}?returnTo=${encodeURIComponent(returnPath)}`;

  return (
    <li className="relative grid gap-4 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_48px] xl:items-center">
      <Link
        href={detailsHref}
        className="absolute inset-0 z-10"
        aria-label={`Ver detalhes do pedido ${order.id}`}
      />
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
                ? "bg-[#fad711] text-black"
                : "bg-muted text-muted-foreground",
          )}
        >
          {statusLabel(order.status)}
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          {billingOptionLabel(order.billing_option?.name)}
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

      <div className="relative z-20 flex justify-end xl:justify-center">
        <details className="group relative">
          <summary
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground [&::-webkit-details-marker]:hidden"
            aria-label={`Ações do pedido ${order.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </summary>
          <div className="absolute bottom-full right-0 z-30 mb-2 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-xl xl:bottom-auto xl:top-full xl:mb-0 xl:mt-2">
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Excluir pedido
            </button>
          </div>
        </details>
      </div>
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

function DeleteOrderDialog({
  order,
  isPending,
  isError,
  onClose,
  onConfirm,
}: {
  order: OrderListItem;
  isPending: boolean;
  isError: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-list-order-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
              Ação permanente
            </p>
            <h2 id="delete-list-order-title" className="mt-1 text-xl font-semibold text-foreground">
              Excluir pedido #{order.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Fechar confirmação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Você está excluindo o pedido de {" "}
            <strong className="text-foreground">{order.user.full_name}</strong>. Esta ação não
            pode ser desfeita.
          </p>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Os vínculos dependentes do pedido também podem ser removidos.
          </div>
          {isError && (
            <div className="rounded-2xl border border-destructive/30 px-4 py-3 text-sm text-destructive">
              Não foi possível excluir o pedido. Tente novamente.
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isPending ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
