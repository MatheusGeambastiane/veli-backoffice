"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMonthlyPlanPayments } from "@/features/billing/queries/billingQueries";
import type { MonthlyPlanPayments } from "@/features/billing/types/billingDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const STATUS_META = {
  paid: {
    label: "Pagas",
    color: "#10b981",
    softColor: "#6ee7b7",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pendentes",
    color: "#f59e0b",
    softColor: "#fcd34d",
    icon: Clock3,
  },
  overdue: {
    label: "Vencidas",
    color: "#f43f5e",
    softColor: "#fda4af",
    icon: TriangleAlert,
  },
} as const;

type PaymentStatus = keyof typeof STATUS_META;

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getStatusAmounts(data?: MonthlyPlanPayments) {
  const amounts: Record<PaymentStatus, number> = {
    paid: data?.totals.received_amount ?? 0,
    pending: 0,
    overdue: 0,
  };

  for (const plan of data?.plans ?? []) {
    for (const entry of plan.entries) {
      if (entry.status !== "pending" && entry.status !== "overdue") continue;
      amounts[entry.status] += Math.max(entry.amount_expected - entry.amount_received, 0);
    }
  }

  return amounts;
}

function MonthlyPaymentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; count: number; amount: number } }>;
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div className="min-w-44 rounded-xl border border-border bg-card/95 p-3 text-card-foreground shadow-xl backdrop-blur">
      <p className="text-sm font-semibold">{item.label}</p>
      <div className="mt-2 space-y-1.5 text-xs">
        <p className="flex items-center justify-between gap-5 text-muted-foreground">
          Quantidade
          <span className="font-semibold text-foreground">
            {numberFormatter.format(item.count)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-5 text-muted-foreground">
          Valor
          <span className="font-semibold text-foreground">
            {currencyFormatter.format(item.amount)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function MonthlyPlanPaymentsChart({ month }: { month: string }) {
  const [syncWithGateway, setSyncWithGateway] = useState(false);
  const { data, isLoading, isError, isFetching } = useMonthlyPlanPayments({
    month,
    sync: syncWithGateway,
  });

  const chartData = useMemo(() => {
    const amounts = getStatusAmounts(data);
    const counts: Record<PaymentStatus, number> = {
      paid: data?.totals.paid_count ?? 0,
      pending: data?.totals.pending_count ?? 0,
      overdue: data?.totals.overdue_count ?? 0,
    };

    return (Object.keys(STATUS_META) as PaymentStatus[]).map((status) => ({
      status,
      label: STATUS_META[status].label,
      count: counts[status],
      amount: amounts[status],
    }));
  }, [data]);

  const totals = data?.totals;

  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 dark:border-white/10">
      <div className="h-1 bg-[linear-gradient(90deg,#10b981_0_33%,#f59e0b_33%_66%,#f43f5e_66%)]" />
      <CardHeader className="gap-4 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">Mensalidades do mês</CardTitle>
            {isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Quantidade e valor por situação em {formatMonthLabel(month)}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-3.5 py-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </span>
          <label htmlFor="billing-gateway-sync" className="cursor-pointer">
            <span className="block text-sm font-semibold text-foreground">
              Sincronizar com gateway
            </span>
            <span className="block text-xs text-muted-foreground">
              Consulta dados atualizados no Asaas
            </span>
          </label>
          <button
            id="billing-gateway-sync"
            type="button"
            role="switch"
            aria-checked={syncWithGateway}
            aria-label="Sincronizar mensalidades com o gateway"
            onClick={() => setSyncWithGateway((current) => !current)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              syncWithGateway ? "border-emerald-500 bg-emerald-500" : "border-border bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                syncWithGateway ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid h-[390px] place-items-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando mensalidades...
            </span>
          </div>
        ) : isError ? (
          <div className="grid h-[240px] place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 px-4 text-center text-sm text-destructive">
            Não foi possível carregar as mensalidades deste mês.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <FinancialTotal label="Valor previsto" value={totals?.expected_amount ?? 0} />
              <FinancialTotal
                label="Valor recebido"
                value={totals?.received_amount ?? 0}
                accent="text-emerald-600 dark:text-emerald-400"
              />
              <FinancialTotal
                label="A receber"
                value={totals?.amount_to_receive ?? 0}
                accent="text-amber-600 dark:text-amber-400"
              />
            </div>

            <div className="mt-5 h-[330px] w-full rounded-2xl border border-border/70 bg-background/50 px-1 pt-5 sm:px-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="4 5"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    yAxisId="count"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{
                      value: "Quantidade",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
                    }}
                  />
                  <YAxis
                    yAxisId="amount"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    width={68}
                    tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{
                      value: "Valores (R$)",
                      angle: 90,
                      position: "insideRight",
                      style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.45 }}
                    content={<MonthlyPaymentTooltip />}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="count"
                    name="Quantidade"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={46}
                  >
                    {chartData.map((item) => (
                      <Cell key={`count-${item.status}`} fill={STATUS_META[item.status].color} />
                    ))}
                  </Bar>
                  <Bar
                    yAxisId="amount"
                    dataKey="amount"
                    name="Valor"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={46}
                  >
                    {chartData.map((item) => (
                      <Cell
                        key={`amount-${item.status}`}
                        fill={STATUS_META[item.status].softColor}
                        opacity={0.68}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {chartData.map((item) => {
                  const meta = STATUS_META[item.status];
                  const Icon = meta.icon;
                  return (
                    <span
                      key={item.status}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                      {item.label}: {numberFormatter.format(item.count)}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-700 dark:bg-slate-300" />
                  Quantidade
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                  Valor
                </span>
                <span className="font-medium text-foreground">
                  Total: {numberFormatter.format(totals?.total_count ?? 0)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FinancialTotal({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/25 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tracking-tight text-foreground", accent)}>
        {currencyFormatter.format(value)}
      </p>
    </div>
  );
}
