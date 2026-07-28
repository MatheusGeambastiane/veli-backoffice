"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Landmark,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  Tag,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useReceivedPaymentDetails } from "@/features/billing/queries/billingQueries";
import type { ReceivedPaymentDetails } from "@/features/billing/types/billingDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const dayLabels: Record<string, string> = {
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sáb",
  Sun: "Dom",
};

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? currencyFormatter.format(parsed) : "-";
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const brDate = value.slice(0, 10).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null, withTime = false) {
  const date = parseDate(value);
  if (!date) return "-";

  return date
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    })
    .replace(".", "");
}

function formatPaymentMethod(value: string) {
  if (value === "pix") return "Pix";
  if (value === "credit_card") return "Cartão de crédito";
  return value || "-";
}

function formatCycleNumbers(data: ReceivedPaymentDetails) {
  if (!data.is_monthly) return "Pagamento único";

  const cycles =
    data.cycle_numbers.length > 0
      ? data.cycle_numbers
      : data.cycle_number !== null
        ? [data.cycle_number]
        : [];

  if (cycles.length === 0) return "Mensalidade";
  if (cycles.length === 1) return `Mensalidade · ciclo ${cycles[0]}`;

  return `Mensalidade · ciclos ${new Intl.ListFormat("pt-BR", {
    style: "short",
    type: "conjunction",
  }).format(cycles.map(String))}`;
}

export function ReceivedPaymentDetailsPage({ paymentId }: { paymentId: string }) {
  const { data, isLoading, isError } = useReceivedPaymentDetails(paymentId);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-[2rem] bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-[2rem] bg-muted" />
          <div className="h-72 animate-pulse rounded-[2rem] bg-muted" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <Link
          href="/billing/received-payments"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pagamentos
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Não foi possível carregar os dados deste pagamento.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/billing/received-payments"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pagamentos
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Pagamento recebido
        </span>
      </div>

      <PaymentHeader data={data} />

      <div className="grid gap-4 sm:grid-cols-3">
        <ValueCard
          label="Valor pago"
          value={formatCurrency(data.amount_gross)}
          icon={<Banknote className="h-5 w-5" />}
          className="border-emerald-500/20 bg-emerald-500/[0.045]"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
        <ValueCard
          label="Valor recebido"
          value={formatCurrency(data.amount_net)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          className="border-teal-500/20 bg-teal-500/[0.045]"
          valueClassName="text-teal-700 dark:text-teal-300"
        />
        <ValueCard
          label="Taxa"
          value={formatCurrency(data.fee_amount)}
          icon={<Landmark className="h-5 w-5" />}
          className="border-amber-500/20 bg-amber-500/[0.045]"
          valueClassName="text-amber-700 dark:text-amber-300"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <UserCard data={data} />
        <PaymentDataCard data={data} />
        <ClassCard data={data} />
        <InvoiceCard data={data} />
      </div>
    </section>
  );
}

function PaymentHeader({ data }: { data: ReceivedPaymentDetails }) {
  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-emerald-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_42%),radial-gradient(circle_at_90%_15%,rgba(20,184,166,0.10),transparent_28%)]" />
      <CardContent className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-300">
            <ReceiptText className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Pagamento #{data.id}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {data.user.full_name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{data.offer.name}</span>
              <span aria-hidden="true">•</span>
              <span>{formatDate(data.paid_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
            {data.is_monthly ? (
              <CreditCard className="h-3.5 w-3.5" />
            ) : (
              <WalletCards className="h-3.5 w-3.5" />
            )}
            {formatCycleNumbers(data)}
          </span>
          {data.is_advance_payment && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <Clock3 className="h-3.5 w-3.5" />
              Adiantamento
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ValueCard({
  label,
  value,
  icon,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  className: string;
  valueClassName: string;
}) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-xl font-semibold tabular-nums", valueClassName)}>{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background/75 text-muted-foreground shadow-sm">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function UserCard({ data }: { data: ReceivedPaymentDetails }) {
  return (
    <DetailsCard title="Usuário" icon={<CircleUserRound className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem
          label="Nome completo"
          value={data.user.full_name}
          icon={<UserRound className="h-4 w-4" />}
        />
        <DetailItem
          label="Username"
          value={data.user.username}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <DetailItem label="E-mail" value={data.user.email} icon={<Mail className="h-4 w-4" />} />
        <DetailItem
          label="Telefone"
          value={data.user.phone || "-"}
          icon={<Phone className="h-4 w-4" />}
        />
        <DetailItem label="CPF" value={data.user.cpf || "-"} />
        <DetailItem label="ID do usuário" value={`#${data.user.id}`} />
      </div>
    </DetailsCard>
  );
}

function PaymentDataCard({ data }: { data: ReceivedPaymentDetails }) {
  return (
    <DetailsCard title="Dados do pagamento" icon={<CreditCard className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem label="ID do pagamento" value={`#${data.id}`} />
        <DetailItem label="ID do pedido" value={`#${data.order.id}`} />
        <DetailItem label="Forma de pagamento" value={formatPaymentMethod(data.billing_method)} />
        <DetailItem label="Modalidade" value={formatCycleNumbers(data)} />
        <DetailItem label="Recebido em" value={formatDate(data.paid_at)} />
        <DetailItem label="Disponível em" value={formatDate(data.available_at)} />
        <DetailItem label="Vencimento" value={formatDate(data.due_date)} />
        <DetailItem label="Origem" value={data.origin || "-"} />
      </div>
    </DetailsCard>
  );
}

function ClassCard({ data }: { data: ReceivedPaymentDetails }) {
  const studentClass = data.student_class;

  return (
    <DetailsCard title="Curso e turma" icon={<GraduationCap className="h-5 w-5" />}>
      {studentClass ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Curso" value={studentClass.course_name} />
          <DetailItem label="Turma" value={`#${studentClass.id}`} />
          <DetailItem label="Professor" value={studentClass.teacher_full_name || "-"} />
          <DetailItem
            label="Dias"
            value={studentClass.days_of_week.map((day) => dayLabels[day] ?? day).join(", ") || "-"}
          />
          <DetailItem
            label="Horário"
            value={`${studentClass.time.slice(0, 5)} · ${studentClass.duration} min`}
          />
          <DetailItem
            label="Período"
            value={`${formatDate(studentClass.start_date)} a ${formatDate(studentClass.finish_date)}`}
          />
          <DetailItem label="Oferta" value={data.offer.name} />
          <DetailItem label="Campanha" value={data.offer.campaign?.name ?? "-"} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <GraduationCap className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Este pagamento não possui uma turma vinculada.
          </p>
        </div>
      )}
    </DetailsCard>
  );
}

function InvoiceCard({ data }: { data: ReceivedPaymentDetails }) {
  return (
    <DetailsCard title="Invoice e recibo" icon={<FileText className="h-5 w-5" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem
          label="Número da invoice"
          value={data.gateway_invoice_number || "-"}
          icon={<Tag className="h-4 w-4" />}
        />
        <DetailItem label="Status no gateway" value={data.gateway_status || "-"} />
        <DetailItem
          label="ID da cobrança"
          value={data.gateway_charge_id || "-"}
          icon={<Hash className="h-4 w-4" />}
        />
        <DetailItem label="Gateway" value={data.gateway || "-"} />
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.045] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Recibo do pagamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Abra o comprovante disponibilizado pelo gateway.
            </p>
          </div>
          {data.receipt_url ? (
            <a
              href={data.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Ver recibo
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Recibo indisponível</span>
          )}
        </div>
      </div>
    </DetailsCard>
  );
}

function DetailsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[2rem] border-slate-200/80 dark:border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </span>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 flex min-w-0 items-center gap-1.5 break-words text-sm font-semibold text-foreground">
        {icon}
        <span className="min-w-0 break-all">{value}</span>
      </p>
    </div>
  );
}
