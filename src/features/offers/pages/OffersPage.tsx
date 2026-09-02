"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useOffersList } from "@/features/offers/queries/offersQueries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DataSurface, PageHeader, PageStat, PageToolbar } from "@/shared/components/ui/page";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

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

function getCampaignLabel(
  campaign: { id: number; name: string } | null | number | string | undefined,
) {
  if (!campaign) return "Sem campanha";
  if (typeof campaign === "object" && "name" in campaign) return campaign.name;
  return String(campaign);
}

export function OffersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const deferredSearch = useDeferredValue(search.trim());

  const { data, isLoading, isError, isFetching } = useOffersList({
    name: deferredSearch || undefined,
    page,
    pageSize,
  });

  const offers = data?.results ?? [];
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
        title="Ofertas"
        description="Centralize pacotes comerciais, relações com campanhas e estruturas de pagamento."
        actions={<PageStat label="Total" value={totalCount} />}
      />

      <PageToolbar className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar oferta por nome"
            className="h-11 bg-background pl-9"
            aria-label="Buscar ofertas"
          />
        </div>

        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
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

        <Link href="/offers/new">
          <Button type="button" className="h-11">
            <Plus className="h-4 w-4" />
            Criar oferta
          </Button>
        </Link>
      </PageToolbar>

      <PaginationBar
        pageLabel={pageLabel}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        isFetching={isFetching}
      />

      <DataSurface>
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-4 border-b border-border/80 bg-muted/20 px-6 py-4 text-xs font-medium text-muted-foreground lg:grid">
          <span>Nome</span>
          <span>Preço</span>
          <span>Campanha</span>
        </div>

        {isLoading && (
          <div className="space-y-3 px-6 py-6">
            <div className="h-16 animate-pulse rounded-md bg-muted" />
            <div className="h-16 animate-pulse rounded-md bg-muted" />
            <div className="h-16 animate-pulse rounded-md bg-muted" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="px-6 py-8 text-sm text-destructive">Erro ao carregar ofertas.</div>
        )}

        {!isLoading && !isError && offers.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma oferta encontrada para os filtros atuais.
          </div>
        )}

        {!isLoading && !isError && offers.length > 0 && (
          <ul className="divide-y divide-border/80">
            {offers.map((offer) => (
              <li key={offer.id} className="px-4 py-3 sm:px-6">
                <Link
                  href={`/offers/${offer.id}`}
                  className="grid cursor-pointer gap-3 rounded-md border border-transparent bg-background/60 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center"
                >
                  <DataCell label="Nome" value={offer.name} strong />
                  <DataCell label="Preço" value={formatCurrency(offer.price)} />
                  <DataCell label="Campanha" value={getCampaignLabel(offer.campaign)} />
                </Link>
              </li>
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
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
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

function DataCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="text-sm text-muted-foreground">
      <span className="text-xs font-medium text-muted-foreground lg:hidden">{label}</span>
      <p className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</p>
    </div>
  );
}
