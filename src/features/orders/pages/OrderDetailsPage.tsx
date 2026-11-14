"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  Mail,
  PackageOpen,
  ReceiptText,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useDeleteOrder, useOrderDetails } from "@/features/orders/queries/ordersQueries";
import { useClassDetails } from "@/features/classes/queries/classesQueries";
import type {
  OrderDetail,
  OrderGatewayPayment,
  OrderPayment,
} from "@/features/orders/types/order";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

type OrderDetailsPageProps = {
  orderId: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const STATUS_LABELS: Record<string, string> = {
  waiting_payment: "Aguardando pagamento",
  active: "Ativo",
  paid: "Pago",
  past_due: "Em atraso",
  pending: "Pendente",
  processing: "Processando",
  failed: "Falhou",
  canceled: "Cancelado",
  expired: "Expirado",
  refunded: "Estornado",
  disputed: "Em disputa",
  chargeback: "Chargeback",
  draft: "Rascunho",
  pending_contract: "Aguardando contrato",
  pending_payment: "Aguardando pagamento",
  accepted: "Aceito",
  rejected: "Recusado",
};

const VALUE_LABELS: Record<string, string> = {
  pix: "Pix",
  credit: "Cartão de crédito",
  credit_card: "Cartão de crédito",
  debit: "Cartão de débito",
  one_time: "Pagamento único",
  monthly: "Mensal",
  upfront: "Pagamento inicial",
  subscription_initial: "Início da assinatura",
  subscription_cycle: "Ciclo da assinatura",
  subscription_payoff: "Quitação",
  recurring: "Recorrente",
  asaas: "Asaas",
  abacatepay: "AbacatePay",
};

function label(value?: string | null) {
  if (!value) return "-";
  return STATUS_LABELS[value] ?? VALUE_LABELS[value] ?? value.replaceAll("_", " ");
}

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? currencyFormatter.format(parsed) : "-";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function effectiveOrderAmount(order: OrderDetail) {
  const due = Number(order.amount_due);
  if (due > 0) return order.amount_due;
  const selectedOption = order.offer.billing_options.find(
    (option) => option.code === order.billing_option?.name,
  );
  return selectedOption?.price ?? order.offer.price;
}

function statusClass(status: string) {
  if (["active", "paid", "accepted"].includes(status)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (["waiting_payment", "pending", "pending_payment", "processing"].includes(status)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (["failed", "past_due", "chargeback", "disputed"].includes(status)) {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  return "border-border bg-muted text-muted-foreground";
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedReturnPath = searchParams.get("returnTo");
  const returnPath = requestedReturnPath === "/orders" || requestedReturnPath?.startsWith("/orders?")
    ? requestedReturnPath
    : "/orders";
  const { data, isLoading, isError } = useOrderDetails(orderId);
  const deleteOrder = useDeleteOrder();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteOrder.mutateAsync(orderId);
      router.replace(returnPath);
      router.refresh();
    } catch {
      // The mutation state renders the contextual error in the confirmation dialog.
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6" aria-label="Carregando pedido">
        <div className="h-12 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <Link href={returnPath}>
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para pedidos
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          Não foi possível carregar este pedido. Ele pode ter sido excluído ou você pode não ter
          acesso a ele.
        </div>
      </section>
    );
  }

  const gatewayPayments = data.gateway_payments ?? data.asaas_payments ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={returnPath}>
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Pedidos
          </Button>
        </Link>
        <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" />
          Excluir pedido
        </Button>
      </div>

      <OrderHeader order={data} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          <RequestCard order={data} />
          <PaymentsCard payments={data.payments} gatewayPayments={gatewayPayments} />
        </div>
        <div className="space-y-6">
          <ChosenClassCard order={data} />
          <OfferCard order={data} />
          <GatewayCard order={data} gatewayPayments={gatewayPayments} />
        </div>
      </div>

      <DangerZone onDelete={() => setIsDeleteOpen(true)} />

      {isDeleteOpen && (
        <DeleteOrderDialog
          order={data}
          isPending={deleteOrder.isPending}
          isError={deleteOrder.isError}
          onClose={() => {
            if (!deleteOrder.isPending) {
              deleteOrder.reset();
              setIsDeleteOpen(false);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

function OrderHeader({ order }: { order: OrderDetail }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="relative space-y-7 px-6 py-7 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Pedido #{order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                <Link
                  href={`/users/${order.user.id}`}
                  className="group inline-flex items-center gap-2 rounded-md outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                  aria-label={`Ver perfil de ${order.user.full_name}`}
                >
                  <span>{order.user.full_name}</span>
                  <ExternalLink className="h-5 w-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {order.user.email}
              </p>
            </div>
          </div>
          <div className="min-w-56 rounded-2xl border border-primary/15 bg-background/75 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Valor do pedido
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(effectiveOrderAmount(order))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(order.total_paid)} recebido
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderMetric icon={CalendarDays} label="Criado em" value={formatDateTime(order.created_at)} />
          <HeaderMetric icon={CircleDollarSign} label="Forma" value={label(order.payment_type)} />
          <HeaderMetric icon={Landmark} label="Gateway" value={order.gateways.map(label).join(", ") || "Não definido"} />
          <HeaderMetric icon={ReceiptText} label="Checkout" value={label(order.checkout_status)} />
        </div>
      </div>
    </div>
  );
}

function HeaderMetric({ icon: Icon, label: title, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-foreground" title={value}>{value}</p>
    </div>
  );
}

function RequestCard({ order }: { order: OrderDetail }) {
  return (
    <SectionCard icon={FileText} title="Dados do pedido" subtitle="Requisição e condições registradas no checkout">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Info label="Identificador" value={`#${order.id}`} />
        <Info label="Status da requisição" value={label(order.checkout_status)} />
        <Info label="Modo de pagamento" value={label(order.payment_mode)} />
        <Info label="Parcelas" value={order.payment_installments ? `${order.payment_installments}x` : "À vista"} />
        <Info label="Período inicial" value={formatDateTime(order.current_period_start)} />
        <Info label="Período final" value={formatDateTime(order.current_period_end)} />
        <Info label="Contrato" value={label(order.contract_acceptance_status)} />
        <Info label="Contrato aceito em" value={formatDateTime(order.contract_accepted_at)} />
        <Info label="CPF" value={order.user.cpf ?? "-"} />
        <Info label="Telefone" value={order.user.phone ?? "-"} />
      </div>
    </SectionCard>
  );
}

const WEEKDAY_LABELS: Record<string, string> = {
  Mon: "Segunda-feira", Tue: "Terça-feira", Wed: "Quarta-feira",
  Thu: "Quinta-feira", Fri: "Sexta-feira", Sat: "Sábado", Sun: "Domingo",
};

const PERIOD_LABELS: Record<string, string> = {
  morning: "Manhã", afternoon: "Tarde", night: "Noite", no_preference: "Sem preferência",
};

function formatClassDate(value: string) {
  const parts = value.split("-");
  return parts.length === 3 ? parts.reverse().join("/") : value || "Não informado";
}

function ChosenClassCard({ order }: { order: OrderDetail }) {
  const studentClass = order.class_preference;
  const { data: classDetails } = useClassDetails(studentClass ? String(studentClass.id) : "");
  const preferredPeriods = order.preference_period.map((period) => PERIOD_LABELS[period] ?? period).join(", ");

  return (
    <SectionCard icon={CalendarDays} title="Turma escolhida" subtitle="Seleção registrada neste pedido">
      {studentClass ? (
        <>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-lg font-semibold text-foreground">
              {classDetails?.name || `${studentClass.course_name} · Turma #${studentClass.id}`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{studentClass.course_name}</p>
            {studentClass.is_generic ? (
              <p className="mt-2 text-sm text-muted-foreground">Turma genérica · horário a definir</p>
            ) : null}
          </div>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Info label="Identificador da turma" value={`#${studentClass.id}`} />
            <Info label="Professor" value={studentClass.teacher_full_name || "A definir"} />
            {!studentClass.is_generic ? (
              <>
                <Info label="Dias da semana" value={studentClass.days_of_week.map((day) => WEEKDAY_LABELS[day] ?? day).join(", ") || "A definir"} />
                <Info label="Horário" value={studentClass.time?.slice(0, 5) || "A definir"} />
                <Info label="Duração da aula" value={`${studentClass.duration} minutos`} />
                <Info label="Período da turma" value={`${formatClassDate(studentClass.start_date)} até ${formatClassDate(studentClass.finish_date)}`} />
              </>
            ) : null}
            {preferredPeriods ? <Info label="Turno de preferência" value={preferredPeriods} /> : null}
          </div>
          <Link href={`/classes/${studentClass.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Abrir turma
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <div className="space-y-4">
          <EmptyState message="Nenhuma turma específica foi escolhida neste pedido." />
          {preferredPeriods ? <Info label="Turno de preferência" value={preferredPeriods} /> : null}
        </div>
      )}
    </SectionCard>
  );
}

function OfferCard({ order }: { order: OrderDetail }) {
  const selectedOption = order.offer.billing_options.find(
    (option) => option.code === order.billing_option?.name,
  );

  return (
    <SectionCard icon={PackageOpen} title="Oferta" subtitle="Produto e condição comercial vinculados">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-foreground">{order.offer.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.offer.campaign?.name ?? "Sem campanha"}
            </p>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", order.offer.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
            {order.offer.is_active ? "Ativa" : "Inativa"}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Info label="Preço da oferta" value={formatCurrency(order.offer.price)} />
        <Info label="Opção de cobrança" value={order.billing_option?.name ?? "-"} mono />
        <Info label="Valor original" value={formatCurrency(order.amount_original || order.offer.price)} />
        <Info label="Desconto" value={formatCurrency(order.discount_amount)} />
        <Info label="Valor devido" value={formatCurrency(effectiveOrderAmount(order))} />
        <Info label="Ciclo" value={label(selectedOption?.cycle ?? order.offer.plan_type)} />
      </div>
      <Link href={`/offers/${order.offer.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        Abrir oferta
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </SectionCard>
  );
}

function PaymentsCard({ payments, gatewayPayments }: { payments: OrderPayment[]; gatewayPayments: OrderGatewayPayment[] }) {
  const hasPayments = payments.length > 0 || gatewayPayments.length > 0;

  return (
    <SectionCard icon={CreditCard} title="Pagamentos" subtitle="Transações e cobranças relacionadas ao pedido">
      {!hasPayments ? (
        <EmptyState message="Nenhum pagamento foi registrado para este pedido." />
      ) : (
        <div className="space-y-3">
          {gatewayPayments.map((payment) => (
            <div key={`gateway-${payment.id}`} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{formatCurrency(payment.amount_gross)}</p>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {label(payment.gateway)} · {label(payment.billing_method)} · {label(payment.origin)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at ?? payment.created_at)}</p>
              </div>
              <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                <span>ID do gateway: <strong className="font-medium text-foreground">{payment.gateway_charge_id ?? "-"}</strong></span>
                <span>Líquido: <strong className="font-medium text-foreground">{formatCurrency(payment.amount_net)}</strong></span>
              </div>
            </div>
          ))}
          {payments.map((payment) => (
            <div key={`payment-${payment.id}`} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {label(payment.gateway)} · {label(payment.payment_method)}
                    {payment.card_last4 ? ` · final ${payment.card_last4}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at ?? payment.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function GatewayCard({ order, gatewayPayments }: { order: OrderDetail; gatewayPayments: OrderGatewayPayment[] }) {
  const gateways = order.gateways.length
    ? order.gateways
    : Array.from(new Set(gatewayPayments.map((payment) => payment.gateway).filter(Boolean)));

  return (
    <SectionCard icon={ShieldCheck} title="Gateway usado" subtitle="Processadores responsáveis pela cobrança">
      {gateways.length === 0 ? (
        <EmptyState message="O gateway ainda não foi definido." />
      ) : (
        <div className="space-y-3">
          {gateways.map((gateway) => {
            const related = gatewayPayments.filter((payment) => payment.gateway === gateway);
            return (
              <div key={gateway} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{label(gateway)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {related.length} {related.length === 1 ? "cobrança" : "cobranças"}
                    </p>
                  </div>
                </div>
                <BadgeCheck className="h-5 w-5 text-success" />
              </div>
            );
          })}
        </div>
      )}
      {order.billing_subscription && (
        <div className="mt-5 grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2">
          <Info label="Assinatura" value={label(order.billing_subscription.status)} />
          <Info label="Próxima cobrança" value={formatDateTime(order.billing_subscription.next_due_date)} />
          <Info label="ID no gateway" value={order.billing_subscription.gateway_subscription_id ?? "-"} mono />
          <Info label="Método" value={label(order.billing_subscription.billing_method)} />
        </div>
      )}
    </SectionCard>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }: { icon: typeof FileText; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function Info({ label: title, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <p className={cn("mt-1 break-words text-sm font-semibold text-foreground", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", statusClass(status))}>
      {label(status)}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
      <Clock3 className="h-5 w-5" />
      {message}
    </div>
  );
}

function DangerZone({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-destructive/25 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-foreground">Zona de perigo</p>
        <p className="mt-1 text-sm text-muted-foreground">A exclusão do pedido é permanente e não pode ser desfeita.</p>
      </div>
      <Button type="button" variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
        Excluir pedido
      </Button>
    </div>
  );
}

function DeleteOrderDialog({ order, isPending, isError, onClose, onConfirm }: { order: OrderDetail; isPending: boolean; isError: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-order-title" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Ação permanente</p>
            <h2 id="delete-order-title" className="mt-1 text-xl font-semibold text-foreground">Excluir pedido #{order.id}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isPending} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent" aria-label="Fechar confirmação">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Você está excluindo o pedido de <strong className="text-foreground">{order.user.full_name}</strong>, referente à oferta <strong className="text-foreground">{order.offer.name}</strong>.
          </p>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Os vínculos dependentes do pedido também podem ser removidos. Esta ação não pode ser desfeita.
          </div>
          {isError && <div className="rounded-2xl border border-destructive/30 px-4 py-3 text-sm text-destructive">Não foi possível excluir o pedido. Tente novamente.</div>}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isPending ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
