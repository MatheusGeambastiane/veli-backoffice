"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Plus,
  ReceiptText,
  X,
} from "lucide-react";
import {
  useBillDetails,
  useCreateFinanceTransaction,
} from "@/features/billing/queries/billingQueries";
import type {
  BillDetails,
  BillStatus,
  FinanceTransaction,
} from "@/features/billing/types/billingDashboard";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

type BillDetailsPageProps = {
  billId: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatCurrencyString(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return currencyFormatter.format(parsed);
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number(digits) / 100;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(2);
}

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const normalized = value.slice(0, 10);
  const brDateMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const isoDateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

function formatDateLabel(value?: string | null) {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}

function formatMonthLabel(value?: string | null) {
  const date = parseDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getBillStatusMeta(status: BillStatus) {
  if (status === "paid") {
    return {
      label: "Pago",
      icon: CheckCircle,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (status === "canceled") {
    return {
      label: "Cancelado",
      icon: ReceiptText,
      className: "bg-muted text-muted-foreground",
    };
  }

  return {
    label: "Pendente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };
}

export function BillDetailsPage({ billId }: BillDetailsPageProps) {
  const { data, isLoading, isError } = useBillDetails(billId);
  const createFinanceTransaction = useCreateFinanceTransaction({ billId });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-36 animate-pulse rounded-[2rem] bg-muted" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-muted" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <Link href="/billing">
          <Button type="button" variant="outline" className="rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nao foi possivel carregar a conta.
        </div>
      </section>
    );
  }

  const transactions = data.finance_transactions ?? [];
  const paidAmount = transactions.reduce(
    (total, transaction) => total + (Number(transaction.amount) || 0),
    0
  );
  const pendingAmount = Math.max((Number(data.amount) || 0) - paidAmount, 0);

  function openPaymentModal() {
    setPaymentAmount("");
    setPaymentDescription("");
    setPaymentReceipt(null);
    setPaymentError(null);
    createFinanceTransaction.reset();
    setIsPaymentModalOpen(true);
  }

  function closePaymentModal() {
    if (createFinanceTransaction.isPending) return;
    setIsPaymentModalOpen(false);
    setPaymentError(null);
    createFinanceTransaction.reset();
  }

  async function handleCreatePayment() {
    const amount = normalizeMoneyInput(paymentAmount);

    if (!amount) {
      setPaymentError("Informe um valor maior que zero.");
      return;
    }

    setPaymentError(null);

    const formData = new FormData();
    formData.set("direction", "expense");
    formData.set("amount", amount);
    formData.set("description", paymentDescription.trim());
    formData.set("bill", billId);

    if (paymentReceipt) {
      formData.set("payment_receipt", paymentReceipt);
    }

    try {
      await createFinanceTransaction.mutateAsync(formData);
      closePaymentModal();
    } catch {
      // The mutation state drives the visible error message in the modal.
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/billing">
          <Button type="button" variant="outline" className="rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <BillStatusBadge status={data.status} />
      </div>

      <BillHeader data={data} />

      <BillTransactionsSection
        items={transactions}
        pendingAmount={pendingAmount}
        onCreate={openPaymentModal}
      />

      {isPaymentModalOpen && (
        <BillPaymentModal
          amount={paymentAmount}
          description={paymentDescription}
          receipt={paymentReceipt}
          pendingAmount={pendingAmount}
          isSubmitting={createFinanceTransaction.isPending}
          error={
            paymentError ??
            (createFinanceTransaction.isError ? "Nao foi possivel adicionar o pagamento." : null)
          }
          onAmountChange={(value) => {
            setPaymentAmount(value);
            setPaymentError(null);
          }}
          onDescriptionChange={setPaymentDescription}
          onReceiptChange={setPaymentReceipt}
          onClose={closePaymentModal}
          onSubmit={handleCreatePayment}
        />
      )}
    </section>
  );
}

function BillStatusBadge({ status }: { status: BillStatus }) {
  const meta = getBillStatusMeta(status);
  const StatusIcon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        meta.className
      )}
    >
      <StatusIcon className="h-4 w-4" />
      {meta.label}
    </span>
  );
}

function BillHeader({ data }: { data: BillDetails }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_24%)]" />
      <div className="relative grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Conta
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-foreground sm:text-3xl">
              {data.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Competencia {formatMonthLabel(data.competence_month)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1">
              {data.category}
            </span>
          </div>
          {data.description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{data.description}</p>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-orange-500/20 bg-orange-500/10 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Valor</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatCurrencyString(data.amount)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Vencimento {formatDateLabel(data.due_date)}
          </p>
        </div>
      </div>
    </div>
  );
}

function BillTransactionsSection({
  items,
  pendingAmount,
  onCreate,
}: {
  items: FinanceTransaction[];
  pendingAmount: number;
  onCreate: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Pagamentos realizados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pendente: {formatCurrencyString(pendingAmount)}
          </p>
        </div>
        <Button type="button" size="sm" className="rounded-2xl" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Adicionar pagamento
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum pagamento realizado.
          </div>
        ) : (
          <ul className="divide-y divide-border/80">
            {items.map((item) => (
              <BillTransactionRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BillTransactionRow({ item }: { item: FinanceTransaction }) {
  return (
    <li className="py-2">
      <div className="grid gap-3 rounded-[1.35rem] border border-transparent bg-background/60 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {formatCurrencyString(item.amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.description || "Sem descricao"}
          </p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pago em</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatDateLabel(item.occurred_at)}
          </p>
        </div>
      </div>
    </li>
  );
}

function BillPaymentModal({
  amount,
  description,
  receipt,
  pendingAmount,
  isSubmitting,
  error,
  onAmountChange,
  onDescriptionChange,
  onReceiptChange,
  onClose,
  onSubmit,
}: {
  amount: string;
  description: string;
  receipt: File | null;
  pendingAmount: number;
  isSubmitting: boolean;
  error: string | null;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onReceiptChange: (value: File | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:items-center sm:justify-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar adicao de pagamento"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Financeiro
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Adicionar pagamento</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-payment-amount">Valor</Label>
            <Input
              id="bill-payment-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(event) => onAmountChange(formatMoneyInput(event.target.value))}
              placeholder="1.500,00"
            />
            <p className="text-xs text-muted-foreground">
              Pendente de pagamento: {formatCurrencyString(pendingAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-payment-description">Descricao</Label>
            <Input
              id="bill-payment-description"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Pagamento de aluguel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-payment-receipt">Arquivo</Label>
            <Input
              id="bill-payment-receipt"
              type="file"
              onChange={(event) => onReceiptChange(event.target.files?.[0] ?? null)}
            />
            {receipt ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {receipt.name}
              </p>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Adicionar pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}
