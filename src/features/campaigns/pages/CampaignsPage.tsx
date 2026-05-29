"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useCampaignsList,
  useCreateCampaign,
  useDeleteCampaign,
} from "@/features/campaigns/queries/campaignsQueries";
import type { CampaignListItem } from "@/features/campaigns/types/campaign";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

type CampaignFormState = {
  name: string;
  startDate: string;
  finishDate: string;
  salesTarget: string;
};

type CampaignFormErrors = Partial<Record<keyof CampaignFormState, string>>;

const DEFAULT_FORM: CampaignFormState = {
  name: "",
  startDate: "",
  finishDate: "",
  salesTarget: "",
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

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return currencyFormatter.format(amount);
}

function currencyInputToApiValue(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}

function normalizeDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function dateInputToApiValue(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

function validateForm(values: CampaignFormState) {
  const errors: CampaignFormErrors = {};
  const startDateApi = dateInputToApiValue(values.startDate);
  const finishDateApi = dateInputToApiValue(values.finishDate);
  const salesTargetValue = currencyInputToApiValue(values.salesTarget);

  if (!values.name.trim()) {
    errors.name = "Informe o nome da campanha.";
  }

  if (!values.startDate.trim()) {
    errors.startDate = "Informe a data de inicio.";
  } else if (!startDateApi) {
    errors.startDate = "Use o formato DD/MM/YYYY.";
  }

  if (!values.finishDate.trim()) {
    errors.finishDate = "Informe a data de fim.";
  } else if (!finishDateApi) {
    errors.finishDate = "Use o formato DD/MM/YYYY.";
  }

  if (!values.salesTarget.trim()) {
    errors.salesTarget = "Informe a meta de vendas.";
  } else if (!salesTargetValue || Number(salesTargetValue) <= 0) {
    errors.salesTarget = "Informe uma meta maior que zero.";
  }

  if (startDateApi && finishDateApi && finishDateApi < startDateApi) {
    errors.finishDate = "A data final nao pode ser anterior ao inicio.";
  }

  return {
    errors,
    normalized: {
      name: values.name.trim(),
      start_date: startDateApi,
      finish_date: finishDateApi,
      salles_target: salesTargetValue,
    },
  };
}

export function CampaignsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState<CampaignFormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<CampaignFormErrors>({});
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignListItem | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const { data, isLoading, isError, isFetching } = useCampaignsList({
    name: deferredSearch || undefined,
    page,
    pageSize,
  });
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const campaigns = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const nextPageFromApi = parsePageFromUrl(data?.next ?? null);
  const previousPageFromApi = parsePageFromUrl(data?.previous ?? null);
  const canGoPrevious = previousPageFromApi !== null || page > 1;
  const canGoNext = nextPageFromApi !== null || page < totalPages;

  const pageLabel = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    return `Pagina ${safePage} de ${totalPages}`;
  }, [page, totalPages]);

  function resetCreateForm() {
    setFormState(DEFAULT_FORM);
    setFormErrors({});
    createCampaign.reset();
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    if (createCampaign.isPending) return;
    setIsCreateOpen(false);
    resetCreateForm();
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

  async function handleCreateCampaign() {
    const { errors, normalized } = validateForm(formState);
    setFormErrors(errors);

    if (
      Object.keys(errors).length > 0 ||
      !normalized.start_date ||
      !normalized.finish_date ||
      !normalized.salles_target
    ) {
      return;
    }

    try {
      await createCampaign.mutateAsync({
        name: normalized.name,
        start_date: normalized.start_date,
        finish_date: normalized.finish_date,
        salles_target: normalized.salles_target,
      });
      handleCloseCreate();
    } catch {
      // handled by mutation state
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      await deleteCampaign.mutateAsync(deleteTarget.id);
      if (campaigns.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      setDeleteTarget(null);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_36%),radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="relative flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Financeiro
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Campanhas
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Acompanhe metas, faturamento e o ritmo comercial das campanhas ativas em uma
                visao mais executiva.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricHighlight
              label="Total de campanhas"
              value={String(totalCount)}
              icon={Megaphone}
              tone="sky"
            />
            <MetricHighlight
              label="Meta consolidada"
              value={formatCurrency(
                campaigns.reduce((total, campaign) => total + Number(campaign.salles_target), 0)
              )}
              icon={CalendarDays}
              tone="emerald"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar campanha por nome"
            className="h-11 rounded-2xl border-border bg-card pl-9 shadow-sm"
            aria-label="Buscar campanhas"
          />
        </div>

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

        <Button type="button" className="h-11 rounded-2xl" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Criar campanha
        </Button>
      </div>

      <CampaignsPagination
        pageLabel={pageLabel}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        isFetching={isFetching}
      />

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card/95 shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] gap-4 border-b border-border/80 bg-muted/20 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground lg:grid">
          <span>Nome</span>
          <span>Data de inicio</span>
          <span>Data final</span>
          <span>Valor meta</span>
          <span>Valor faturado</span>
          <span className="text-right">Opcao</span>
        </div>

        {isLoading && (
          <div className="space-y-3 px-6 py-6">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="px-6 py-8 text-sm text-destructive">Erro ao carregar campanhas.</div>
        )}

        {!isLoading && !isError && campaigns.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma campanha encontrada para os filtros atuais.
          </div>
        )}

        {!isLoading && !isError && campaigns.length > 0 && (
          <ul className="divide-y divide-border/80">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                isOptionsOpen={openOptionsId === campaign.id}
                onToggleOptions={(event) => {
                  event.stopPropagation();
                  setOpenOptionsId((current) => (current === campaign.id ? null : campaign.id));
                }}
                onCloseOptions={() => setOpenOptionsId(null)}
                onDelete={(event) => {
                  event.stopPropagation();
                  setDeleteTarget(campaign);
                  setOpenOptionsId(null);
                }}
                onOpen={() => router.push(`/campaigns/${campaign.id}`)}
              />
            ))}
          </ul>
        )}
      </div>

      <CampaignsPagination
        pageLabel={pageLabel}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        isFetching={isFetching}
      />

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-campaign-title"
          onClick={handleCloseCreate}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-border px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(14,165,233,0.95),rgba(16,185,129,0.8))]" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nova campanha</p>

                </div>
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, name: event.target.value }));
                    setFormErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Campanha Maio 2026"
                  className="h-11 rounded-2xl"
                />
                {formErrors.name && <FieldError message={formErrors.name} />}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data de inicio</label>
                  <Input
                    value={formState.startDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        startDate: normalizeDateInput(event.target.value),
                      }));
                      setFormErrors((current) => ({ ...current, startDate: undefined }));
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD/MM/YYYY"
                    className="h-11 rounded-2xl"
                  />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Formato DD/MM/YYYY
                  </p>
                  {formErrors.startDate && <FieldError message={formErrors.startDate} />}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data de fim</label>
                  <Input
                    value={formState.finishDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        finishDate: normalizeDateInput(event.target.value),
                      }));
                      setFormErrors((current) => ({ ...current, finishDate: undefined }));
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD/MM/YYYY"
                    className="h-11 rounded-2xl"
                  />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Formato DD/MM/YYYY
                  </p>
                  {formErrors.finishDate && <FieldError message={formErrors.finishDate} />}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Meta de vendas</label>
                <Input
                  value={formState.salesTarget}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      salesTarget: formatCurrencyInput(event.target.value),
                    }));
                    setFormErrors((current) => ({ ...current, salesTarget: undefined }));
                  }}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  className="h-11 rounded-2xl"
                />

                {formErrors.salesTarget && <FieldError message={formErrors.salesTarget} />}
              </div>

              {createCampaign.isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Erro ao criar campanha. Revise os dados e tente novamente.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={handleCloseCreate}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-11 rounded-2xl"
                onClick={handleCreateCampaign}
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending ? "Criando..." : "Criar campanha"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-campaign-title"
          onClick={() => {
            if (!deleteCampaign.isPending) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              <h2 id="delete-campaign-title" className="text-xl font-semibold text-foreground">
                Excluir campanha
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Tem certeza que deseja excluir <span className="font-semibold text-foreground">{deleteTarget.name}</span>?
              </p>
              {deleteCampaign.isError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Nao foi possivel excluir a campanha.
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteCampaign.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11 rounded-2xl"
                onClick={handleConfirmDelete}
                disabled={deleteCampaign.isPending}
              >
                {deleteCampaign.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CampaignsPagination({
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
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{pageLabel}</span>
        {isFetching && <span className="text-xs uppercase tracking-wide">Atualizando...</span>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="rounded-2xl"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded-2xl"
        >
          Proxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CampaignRow({
  campaign,
  isOptionsOpen,
  onToggleOptions,
  onCloseOptions,
  onDelete,
  onOpen,
}: {
  campaign: CampaignListItem;
  isOptionsOpen: boolean;
  onToggleOptions: (event: MouseEvent<HTMLButtonElement>) => void;
  onCloseOptions: () => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>) => void;
  onOpen: () => void;
}) {
  return (
    <li className="px-4 py-3 sm:px-6">
      <div
        className="grid cursor-pointer gap-3 rounded-[1.6rem] border border-transparent bg-background/60 px-4 py-4 transition-all hover:border-sky-500/20 hover:bg-sky-500/[0.05] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] lg:items-center"
        onClick={onOpen}
      >
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground lg:hidden">
            Nome
          </span>
          <p className="truncate font-semibold text-foreground">{campaign.name}</p>
        </div>

        <DataCell label="Data de inicio" value={campaign.start_date} />
        <DataCell label="Data final" value={campaign.finish_date} />
        <DataCell label="Valor meta" value={formatCurrency(campaign.salles_target)} />
        <DataCell label="Valor faturado" value={formatCurrency(campaign.total_billed_amount)} />

        <div className="flex justify-end">
          <CampaignOptionsMenu
            isOpen={isOptionsOpen}
            onToggle={onToggleOptions}
            onClose={onCloseOptions}
            onDelete={onDelete}
          />
        </div>
      </div>
    </li>
  );
}

function CampaignOptionsMenu({
  isOpen,
  onToggle,
  onClose,
  onDelete,
}: {
  isOpen: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (!dropdownRef.current || !event.target) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={onToggle}
        aria-label="Abrir opcoes da campanha"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-20 min-w-44 rounded-2xl border border-border bg-card p-2 shadow-xl">
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            role="menuitem"
          >
            <Trash2 className="h-4 w-4" />
            Excluir campanha
          </button>
        </div>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm text-muted-foreground">
      <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground lg:hidden">
        {label}
      </span>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
}

function MetricHighlight({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Megaphone;
  tone: "sky" | "emerald";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border px-4 py-4 shadow-sm backdrop-blur",
        tone === "sky" && "border-sky-500/20 bg-sky-500/10",
        tone === "emerald" && "border-emerald-500/20 bg-emerald-500/10"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tone === "sky" && "bg-sky-500/15 text-sky-700",
            tone === "emerald" && "bg-emerald-500/15 text-emerald-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
