"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FastForward,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useLatestReceivedPayments } from "@/features/billing/queries/billingQueries";
import type { LatestReceivedPayment } from "@/features/billing/types/billingDashboard";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatCurrency(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? currencyFormatter.format(parsed) : "-";
}

function formatPaidAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
}

function getPaymentMode(payment: LatestReceivedPayment) {
  if (payment.is_monthly) {
    return {
      label: "Mensalidade",
      icon: CreditCard,
      className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  if (payment.is_one_time) {
    return {
      label: "Pagamento único",
      icon: WalletCards,
      className: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }

  return {
    label: payment.payment_mode,
    icon: ReceiptText,
    className: "bg-muted text-muted-foreground",
  };
}

function formatCycleNumbers(payment: LatestReceivedPayment) {
  if (!payment.is_monthly) return null;

  const cycleNumbers =
    payment.cycle_numbers.length > 0
      ? payment.cycle_numbers
      : payment.cycle_number !== null
        ? [payment.cycle_number]
        : [];

  if (cycleNumbers.length === 0) return null;
  if (cycleNumbers.length === 1) return `Ciclo ${cycleNumbers[0]}`;

  const formattedCycles = new Intl.ListFormat("pt-BR", {
    style: "short",
    type: "conjunction",
  }).format(cycleNumbers.map(String));

  return `Ciclos ${formattedCycles}`;
}

export function LatestReceivedPaymentsList() {
  const { data, isLoading, isError, isFetching, refetch } = useLatestReceivedPayments();
  const payments = data?.results ?? [];

  return (
    <Card className="h-full overflow-hidden rounded-[2rem] border-slate-200/80 dark:border-white/10">
      <div className="h-1 bg-[linear-gradient(90deg,#0f766e,#10b981_55%,#6ee7b7)]" />
      <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <ReceiptText className="h-4 w-4" />
            </span>
            <CardTitle className="text-lg">Últimos pagamentos</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Carregando recebimentos..."
              : `${data?.count ?? payments.length} recebimento${
                  (data?.count ?? payments.length) === 1 ? "" : "s"
                } recente${(data?.count ?? payments.length) === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/billing/received-payments"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-xl p-0"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Atualizar últimos pagamentos"
            title="Atualizar pagamentos"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-label="Carregando últimos pagamentos">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-[104px] animate-pulse rounded-2xl border border-border/70 bg-muted/35"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="grid min-h-[240px] place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 px-5 text-center">
            <div>
              <p className="text-sm font-medium text-destructive">
                Não foi possível carregar os últimos pagamentos.
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
          <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 text-center">
            <div>
              <ReceiptText className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Nenhum pagamento recebido</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os recebimentos mais recentes aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <ol className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
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
  );
}

export function ReceivedPaymentListItem({
  payment,
  href,
}: {
  payment: LatestReceivedPayment;
  href?: string;
}) {
  const mode = getPaymentMode(payment);
  const ModeIcon = mode.icon;
  const cycleLabel = formatCycleNumbers(payment);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-semibold text-foreground"
            title={payment.user.full_name}
          >
            {payment.user.full_name}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={payment.offer.name}>
            {payment.offer.name}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatPaidAt(payment.paid_at)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              mode.className,
            )}
          >
            <ModeIcon className="h-3.5 w-3.5" />
            {mode.label}
          </span>

          {cycleLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <CalendarRange className="h-3.5 w-3.5" />
              {cycleLabel}
            </span>
          )}

          {payment.is_advance_payment && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <FastForward className="h-3.5 w-3.5" />
              Adiantamento
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(payment.amount_gross)}
          </p>
          <p className="mt-0.5 inline-flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Recebido:{" "}
            <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatCurrency(payment.amount_net)}
            </span>
          </p>
        </div>
      </div>
      {href && (
        <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      )}
    </>
  );

  const className = cn(
    "group relative block rounded-2xl border border-border/70 bg-background/65 p-4 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/[0.025]",
    href && "pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
