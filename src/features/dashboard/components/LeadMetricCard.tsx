"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, UserRoundSearch } from "lucide-react";
import { useLeadSummary } from "@/features/analytics/queries/analyticsQueries";

const countFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 2,
});

export function LeadMetricCard() {
  const { data, isPending, isError, refetch } = useLeadSummary("");
  const summary = isError ? undefined : data;
  const pending = summary?.stages.not_contacted;
  const seen = summary
    ? summary.stages.in_contact + summary.stages.hired + summary.stages.discarded
    : undefined;

  function formatCount(value: number | undefined) {
    if (isPending) return "...";
    return value === undefined ? "-" : countFormatter.format(value);
  }

  return (
    <section
      aria-labelledby="dashboard-leads-title"
      aria-busy={isPending}
      className="min-w-0 rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="dashboard-leads-title" className="text-sm font-medium text-muted-foreground">
          Leads
        </h2>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
          <UserRoundSearch aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold tabular-nums text-foreground">
        <span className="sr-only">Total de leads: </span>
        {formatCount(summary?.total)}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">Vistos</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatCount(seen)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pendentes de contato</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {formatCount(pending)}
          </dd>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 rounded-md bg-success/10 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Taxa de conversão</dt>
          <dd className="text-sm font-semibold tabular-nums text-success">
            {isPending
              ? "..."
              : summary
                ? percentFormatter.format(summary.success_rate / 100)
                : "-"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Vistos: em contato, contratados ou descartados. Conversão: contratados ÷ total de leads.
      </p>
      {isError ? (
        <p role="alert" className="mt-3 text-xs text-destructive">
          Não foi possível carregar os leads.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Tentar novamente
          </button>
        </p>
      ) : null}
    </section>
  );
}

export function MobileLeadInterestCard({
  activeInterests,
  pendingInterests,
}: {
  activeInterests: number;
  pendingInterests: number;
}) {
  const { data, isPending, isError } = useLeadSummary("");
  const totalInterests = activeInterests + pendingInterests;

  return (
    <section
      aria-labelledby="mobile-commercial-title"
      className="overflow-hidden rounded-[1.25rem] border border-border/80 bg-card shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]"
    >
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Comercial
          </p>
          <h2 id="mobile-commercial-title" className="mt-1 text-base font-semibold text-foreground">
            Leads e interessados
          </h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BadgeCheck aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border border-t border-border/70">
        <Link
          href="/analytics/leads"
          className="group min-w-0 px-5 py-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            Leads
            <UserRoundSearch aria-hidden="true" className="h-4 w-4 text-info" />
          </span>
          <strong className="mt-2 block text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
            {isPending ? "…" : isError ? "—" : countFormatter.format(data?.total ?? 0)}
          </strong>
          <span className="mt-3 block truncate text-[11px] text-muted-foreground">
            {isPending
              ? "Atualizando…"
              : isError
                ? "Dados indisponíveis"
                : `${countFormatter.format(data?.stages.not_contacted ?? 0)} aguardando contato`}
          </span>
        </Link>

        <Link
          href="/orders"
          className="group min-w-0 px-5 py-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            Interessados
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
          <strong className="mt-2 block text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
            {countFormatter.format(totalInterests)}
          </strong>
          <span className="mt-3 block truncate text-[11px] text-muted-foreground">
            {countFormatter.format(activeInterests)} ativos ·{" "}
            {countFormatter.format(pendingInterests)} pendentes
          </span>
        </Link>
      </div>
    </section>
  );
}
