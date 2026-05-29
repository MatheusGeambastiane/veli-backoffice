"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  QrCode,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useOfferDetails } from "@/features/offers/queries/offersQueries";
import type { OfferBillingOption, OfferOrdersByBillingOption } from "@/features/offers/types/offer";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const PIE_COLORS = ["#0ea5e9", "#f97316", "#14b8a6", "#6366f1", "#f43f5e", "#22c55e"] as const;

type OfferDetailsPageProps = {
  offerId: string;
};

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

function statusLabel(value: boolean) {
  return value ? "Ativa" : "Inativa";
}

function planTypeLabel(value?: string | null) {
  if (value === "monthly") return "Mensal";
  if (value === "one_time") return "Pagamento unico";
  return value || "-";
}

function billingMethodLabel(value?: string | null) {
  if (value === "pix") return "Pix";
  if (value === "credit_card") return "Cartao de credito";
  return value || "-";
}

function billingTypeLabel(value?: string | null) {
  if (value === "recurring") return "Recorrente";
  if (value === "one_time") return "Pagamento unico";
  return value || "-";
}

function cycleLabel(value?: string | null) {
  if (value === "monthly") return "Mensal";
  if (value === "none") return "Sem ciclo";
  return value || "-";
}

function billingOptionCodeLabel(code?: string | null) {
  if (code === "UPFRONT_CREDIT_CARD") return "Único por cartão de crédito";
  if (code === "MONTHLY_CREDIT_CARD") return "Mensal por cartão de crédito";
  if (code === "UPFRONT_PIX") return "Pix único";
  if (code === "MONTHLY_PIX") return "Pix mensal";
  return code || "-";
}

function formatDaysOfWeek(days: string[]) {
  const labels: Record<string, string> = {
    Mon: "Seg",
    Tue: "Ter",
    Wed: "Qua",
    Thu: "Qui",
    Fri: "Sex",
    Sat: "Sab",
    Sun: "Dom",
  };
  return days.map((day) => labels[day] ?? day).join(", ") || "-";
}

export function OfferDetailsPage({ offerId }: OfferDetailsPageProps) {
  const { data, isLoading, isError } = useOfferDetails(offerId);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-muted" />
        <div className="h-44 animate-pulse rounded-[2rem] bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-[2rem] bg-muted" />
          <div className="h-28 animate-pulse rounded-[2rem] bg-muted" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-6">
        <BackLink />
        <div className="rounded-[2rem] border border-border bg-card px-6 py-8 text-sm text-destructive shadow-sm">
          Erro ao carregar a oferta.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <BackLink />

      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.14),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Oferta #{data.id}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {data.name}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {data.campaign ? (
                  <>
                    Vinculada a <span className="font-semibold text-foreground">{data.campaign.name}</span>, de{" "}
                    <span className="font-semibold text-foreground">{data.campaign.start_date}</span> ate{" "}
                    <span className="font-semibold text-foreground">{data.campaign.finish_date}</span>.
                  </>
                ) : (
                  "Oferta sem campanha vinculada."
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <HeroMetric label="Total faturado" value={formatCurrency(data.total_billed_amount)} />
            <HeroMetric label="Total de pedidos" value={String(data.total_orders_count)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Preco base" value={formatCurrency(data.price)} icon={CircleDollarSign} tone="orange" />
        <SummaryCard label="Tipo de plano" value={planTypeLabel(data.plan_type)} icon={CreditCard} tone="sky" />
        <SummaryCard
          label="Acesso"
          value={data.access_duration_days ? `${data.access_duration_days} dias` : "-"}
          icon={Clock3}
          tone="emerald"
        />
        <SummaryCard
          label="Status"
          value={statusLabel(data.is_active)}
          icon={data.is_active ? CheckCircle2 : XCircle}
          tone={data.is_active ? "emerald" : "slate"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Informacoes da offer
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Resumo comercial</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailLine label="Nome" value={data.name} />
              <DetailLine label="Campanha" value={data.campaign?.name ?? "-"} />
              <DetailLine label="Preco" value={formatCurrency(data.price)} />
              <DetailLine label="Intervalo de cobranca" value={data.billing_interval_months ? `${data.billing_interval_months} mes(es)` : "-"} />
              <DetailLine label="Periodo de carencia" value={data.grace_period_days ? `${data.grace_period_days} dias` : "-"} />
              <DetailLine label="Desconto a vista" value={data.allow_cash_discount ? "Permitido" : "Nao permitido"} />
              <DetailLine label="Criada em" value={formatDateTime(data.created_at)} />
              <DetailLine label="Atualizada em" value={formatDateTime(data.updated_at)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Pedidos por forma de cobranca
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Distribuicao</h2>
            </div>
            <OrdersByBillingOptionPieChart
              items={data.orders_by_billing_option}
              totalOrders={data.total_orders_count}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <SectionHeader icon={CreditCard} eyebrow="Cobranca" title="Opcoes de pagamento" />
            {data.billing_options.length === 0 ? (
              <EmptyText>Nenhuma opcao de pagamento configurada.</EmptyText>
            ) : (
              <div className="grid gap-3">
                {data.billing_options.map((option) => (
                  <BillingOptionCard key={option.id} option={option} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <SectionHeader icon={BookOpen} eyebrow="Conteudo" title="Cursos vinculados" />
            {data.courses.length === 0 ? (
              <EmptyText>Nenhum curso vinculado.</EmptyText>
            ) : (
              <div className="grid gap-3">
                {data.courses.map((course) => (
                  <div key={course.id} className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-700">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{course.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[course.language_name, course.level_name].filter(Boolean).join(" - ") || "Sem nivel informado"}
                        </p>
                        {course.description && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{course.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-border shadow-sm">
        <CardContent className="space-y-4 p-6">
          <SectionHeader icon={UsersRound} eyebrow="Turmas" title="Turmas da oferta" />
          {data.student_classes.length === 0 ? (
            <EmptyText>Nenhuma turma vinculada.</EmptyText>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.student_classes.map((studentClass) => (
                <div key={studentClass.id} className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{studentClass.course_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {studentClass.teacher_full_name ?? "Professor nao informado"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                        studentClass.is_active
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {statusLabel(studentClass.is_active)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span>{studentClass.start_date} ate {studentClass.finish_date}</span>
                    <span>{studentClass.time.slice(0, 5)} - {studentClass.duration} min</span>
                    <span className="sm:col-span-2">{formatDaysOfWeek(studentClass.days_of_week)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function BackLink() {
  return (
    <Link
      href="/offers"
      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar para ofertas
    </Link>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-orange-500/20 bg-orange-500/10 px-5 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
    </div>
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
  tone: "orange" | "sky" | "emerald" | "slate";
}) {
  const toneClass = {
    orange: "bg-orange-500/10 text-orange-700",
    sky: "bg-sky-500/10 text-sky-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
    slate: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof CreditCard;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="rounded-2xl border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">{children}</p>;
}

function BillingOptionCard({ option }: { option: OfferBillingOption }) {
  const Icon = option.billing_method === "pix" ? QrCode : CreditCard;
  return (
    <div className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-700">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {billingOptionCodeLabel(option.code)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {billingTypeLabel(option.type)} - {cycleLabel(option.cycle)} - {billingMethodLabel(option.billing_method)}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(option.price)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {option.allowed_installments.length > 0 ? (
          option.allowed_installments.map((installment) => (
            <span key={installment} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {installment}x
            </span>
          ))
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            Sem parcelas
          </span>
        )}
      </div>
    </div>
  );
}

function OrdersByBillingOptionPieChart({
  items,
  totalOrders,
}: {
  items: OfferOrdersByBillingOption[];
  totalOrders: number;
}) {
  if (items.length === 0 || totalOrders === 0) {
    return <EmptyText>Nenhum pedido registrado por forma de cobranca.</EmptyText>;
  }

  const segments = items.reduce<{
    cumulative: number;
    values: Array<
      OfferOrdersByBillingOption & {
        color: string;
        start: number;
        end: number;
        percentage: number;
      }
    >;
  }>(
    (accumulator, item, index) => {
      const percentage = item.total_orders / totalOrders;
      const start = accumulator.cumulative * 360;
      const nextCumulative = accumulator.cumulative + percentage;
      const end = nextCumulative * 360;

      return {
        cumulative: nextCumulative,
        values: [
          ...accumulator.values,
          {
            ...item,
            color: PIE_COLORS[index % PIE_COLORS.length],
            start,
            end,
            percentage: Math.round(percentage * 100),
          },
        ],
      };
    },
    { cumulative: 0, values: [] }
  ).values;

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
    .join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-center xl:grid-cols-1 2xl:grid-cols-[210px_minmax(0,1fr)]">
      <div className="mx-auto flex h-[210px] w-[210px] items-center justify-center rounded-full bg-card">
        <div
          className="flex h-full w-full items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pedidos</span>
            <span className="mt-1 text-3xl font-semibold text-foreground">{totalOrders}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.billing_option.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {billingOptionCodeLabel(segment.billing_option.code)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(segment.billing_option.price)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{segment.total_orders}</p>
              <p className="text-[11px] text-muted-foreground">{segment.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
