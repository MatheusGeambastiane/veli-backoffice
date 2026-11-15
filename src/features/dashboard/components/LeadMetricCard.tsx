"use client";

import { UserRoundSearch } from "lucide-react";
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
            {isPending ? "..." : summary ? percentFormatter.format(summary.success_rate / 100) : "-"}
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
