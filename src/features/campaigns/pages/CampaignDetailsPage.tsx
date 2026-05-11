"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, CircleDollarSign, Clock3, CreditCard, PackageOpen } from "lucide-react";
import { useCampaignDetails } from "@/features/campaigns/queries/campaignsQueries";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

type CampaignDetailsPageProps = {
  campaignId: string;
};

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return currencyFormatter.format(parsed);
}

export function CampaignDetailsPage({ campaignId }: CampaignDetailsPageProps) {
  const { data, isLoading, isError } = useCampaignDetails(campaignId);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3 rounded-[2rem] border border-border bg-card px-6 py-6 shadow-sm">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para campanhas
        </Link>
        <div className="rounded-[2rem] border border-border bg-card px-6 py-8 text-sm text-destructive shadow-sm">
          Erro ao carregar a campanha.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/campaigns"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para campanhas
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.14),transparent_30%)]" />
          <div className="relative flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Financeiro
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {data.name}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Janela comercial de <span className="font-semibold text-foreground">{data.start_date}</span> ate{" "}
                  <span className="font-semibold text-foreground">{data.finish_date}</span>.
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Faturamento total</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {formatCurrency(data.total_billed_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Meta de vendas"
          value={formatCurrency(data.salles_target)}
          icon={CircleDollarSign}
          tone="sky"
        />
        <SummaryCard
          label="Pedidos criados"
          value={String(data.total_orders_created)}
          icon={PackageOpen}
          tone="amber"
        />
        <SummaryCard
          label="Pedidos pendentes"
          value={String(data.total_pending_orders)}
          icon={Clock3}
          tone="slate"
        />
        <SummaryCard
          label="Total pago"
          value={formatCurrency(data.total_paid_orders_amount)}
          icon={CreditCard}
          tone="emerald"
        />
      </div>

      <Card className="rounded-[2rem] border-border shadow-sm">
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Informacoes da campanha
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Resumo operacional</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailLine label="Nome" value={data.name} />
                <DetailLine label="Inicio" value={data.start_date} />
                <DetailLine label="Fim" value={data.finish_date} />
                <DetailLine label="Meta" value={formatCurrency(data.salles_target)} />
                <DetailLine label="Faturado" value={formatCurrency(data.total_billed_amount)} />
                <DetailLine label="Atualizado em" value={new Date(data.updated_at).toLocaleString("pt-BR")} />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Conversao da campanha
              </p>
              <div className="mt-4 space-y-4">
                <ProgressMetric
                  label="Atingimento da meta"
                  current={Number(data.total_billed_amount)}
                  target={Number(data.salles_target)}
                />
                <ProgressMetric
                  label="Pagamentos confirmados"
                  current={Number(data.total_paid_orders_amount)}
                  target={Math.max(Number(data.total_billed_amount), 0)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Offers
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">Ofertas vinculadas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.offers.length} offer{data.offers.length === 1 ? "" : "s"} associada
            {data.offers.length === 1 ? "" : "s"}
          </p>
        </div>

        {data.offers.length === 0 && (
          <div className="rounded-[2rem] border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
            Nenhuma offer vinculada a esta campanha.
          </div>
        )}

        {data.offers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.offers.map((offer) => (
              <article
                key={offer.id}
                className="group cursor-pointer rounded-[1.8rem] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/25 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Offer #{offer.id}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                      offer.is_active
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {offer.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="mt-8 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Preco</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(offer.price)}</p>
                  </div>
                  <span className="text-sm text-sky-700 transition-transform group-hover:translate-x-1">
                    Ver detalhe depois
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
  tone: "sky" | "amber" | "slate" | "emerald";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.8rem] border bg-card px-5 py-5 shadow-sm",
        tone === "sky" && "border-sky-500/20",
        tone === "amber" && "border-amber-500/20",
        tone === "slate" && "border-slate-400/20",
        tone === "emerald" && "border-emerald-500/20"
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            tone === "sky" && "bg-sky-500/10 text-sky-700",
            tone === "amber" && "bg-amber-500/10 text-amber-700",
            tone === "slate" && "bg-slate-500/10 text-slate-700",
            tone === "emerald" && "bg-emerald-500/10 text-emerald-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProgressMetric({
  label,
  current,
  target,
}: {
  label: string;
  current: number;
  target: number;
}) {
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.min(100, Math.max(0, (current / safeTarget) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0.95),rgba(16,185,129,0.85))]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>{formatCurrency(current)}</span>
        <span>{formatCurrency(target)}</span>
      </div>
    </div>
  );
}
