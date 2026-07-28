"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ReceivedPaymentListItem } from "@/features/billing/components/LatestReceivedPaymentsList";
import { useReceivedPayments } from "@/features/billing/queries/billingQueries";
import type { ReceivedPaymentsParams } from "@/features/billing/types/billingDashboard";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

const INITIAL_FILTERS: ReceivedPaymentsParams = {
  page: 1,
  page_size: 15,
};

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => firstPage + index);
}

export function ReceivedPaymentsPage() {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [pageSize, setPageSize] = useState("15");
  const [filters, setFilters] = useState<ReceivedPaymentsParams>(INITIAL_FILTERS);
  const { data, isLoading, isError, isFetching, refetch } = useReceivedPayments(filters);

  const payments = data?.results ?? [];
  const currentPage = data?.page ?? filters.page;
  const totalPages = Math.max(data?.total_pages ?? 1, 1);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const firstResult = data?.count
    ? (currentPage - 1) * (data.page_size || filters.page_size) + 1
    : 0;
  const lastResult = data?.count ? Math.min(firstResult + payments.length - 1, data.count) : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      search: search.trim() || undefined,
      month: month || undefined,
      page: 1,
      page_size: Number(pageSize),
    });
  }

  function handleClearFilters() {
    setSearch("");
    setMonth("");
    setPageSize("15");
    setFilters(INITIAL_FILTERS);
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setFilters((current) => ({ ...current, page }));
  }

  const hasActiveFilters = Boolean(filters.search || filters.month || filters.page_size !== 15);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/billing"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para faturamento
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            Financeiro
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Pagamentos recebidos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Consulte recebimentos por usuário ou oferta e acompanhe os valores efetivamente
            creditados.
          </p>
        </div>

        <div className="grid min-w-[min(100%,21rem)] grid-cols-2 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045]">
          <div className="border-r border-emerald-500/15 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total recebido</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              {isLoading ? "..." : currencyFormatter.format(data?.total_amount ?? 0)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Pagamentos</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {isLoading ? "..." : numberFormatter.format(data?.count ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Filtros</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Busque por nome, username, e-mail, telefone, CPF ou oferta.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_13rem_10rem_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="received-payments-search">Pesquisar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="received-payments-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, e-mail, CPF ou oferta"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="received-payments-month">Mês do recebimento</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="received-payments-month"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="received-payments-page-size">Por página</Label>
              <select
                id="received-payments-page-size"
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} itens
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1 rounded-xl lg:flex-none">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-10 rounded-xl p-0"
                  onClick={handleClearFilters}
                  aria-label="Limpar filtros"
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 dark:border-white/10">
        <div className="h-1 bg-[linear-gradient(90deg,#0f766e,#10b981_55%,#6ee7b7)]" />
        <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Recebimentos</CardTitle>
              {isFetching && !isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.count
                ? `Exibindo ${firstResult}–${lastResult} de ${numberFormatter.format(data.count)}`
                : "Nenhum pagamento para exibir"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <Banknote className="h-3.5 w-3.5" />
            Valores líquidos após taxas
          </span>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-[112px] animate-pulse rounded-2xl border border-border/70 bg-muted/35"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 px-5 text-center">
              <div>
                <p className="text-sm font-medium text-destructive">
                  Não foi possível carregar os pagamentos recebidos.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 text-center">
              <div>
                <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Nenhum pagamento encontrado
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tente alterar a pesquisa ou o mês selecionado.
                </p>
              </div>
            </div>
          ) : (
            <ol className="space-y-3">
              {payments.map((payment) => (
                <ReceivedPaymentListItem
                  key={payment.id}
                  payment={payment}
                  href={`/billing/received-payments/${payment.id}`}
                />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && data && data.total_pages > 1 && (
        <nav
          className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row"
          aria-label="Paginação dos pagamentos"
        >
          <p className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!data.previous || isFetching}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            {visiblePages.map((page) => (
              <Button
                key={page}
                type="button"
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className="h-8 min-w-8 rounded-xl px-2"
                disabled={isFetching}
                onClick={() => goToPage(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!data.next || isFetching}
              onClick={() => goToPage(currentPage + 1)}
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
