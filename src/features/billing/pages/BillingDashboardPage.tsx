"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Banknote,
  Ban,
  CalendarDays,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CircleDollarSign,
  Clock,
  ClipboardCheck,
  CreditCard,
  Filter,
  GraduationCap,
  HandCoins,
  Loader2,
  Plus,
  Receipt,
  Repeat,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthlyPlanPaymentsChart } from "@/features/billing/components/MonthlyPlanPaymentsChart";
import {
  useBillingSummary,
  useBills,
  useCreateBill,
  useCreateEmployeePayment,
  useEmployeePaymentsEmployees,
  useEmployeePaymentsSummary,
} from "@/features/billing/queries/billingQueries";
import type {
  Bill,
  BillKind,
  BillRecurrence,
  BillStatus,
  BillingAmountByOffer,
  BillingSummaryParams,
  CreateEmployeePaymentPayload,
  EmployeePayment,
  EmployeePaymentRole,
  EmployeePaymentStatus,
} from "@/features/billing/types/billingDashboard";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"] as const;

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const DEFAULT_EMPLOYEE_PAYMENT_FORM = {
  employee: "",
  amount: "",
  due_date: "",
  status: "pending" as EmployeePaymentStatus,
  description: "",
  competence_month: getCurrentMonthValue(),
  is_recurring: false,
  recurrence_end_date: "",
};

type EmployeePaymentFormState = typeof DEFAULT_EMPLOYEE_PAYMENT_FORM;
type EmployeePaymentFormErrors = Partial<Record<keyof EmployeePaymentFormState, string>>;

const DEFAULT_BILL_FORM = {
  name: "",
  category: "",
  kind: "fixed" as BillKind,
  amount: "",
  due_date: "",
  status: "pending" as BillStatus,
  competence_month: getCurrentMonthValue(),
  description: "",
  is_recurring: false,
  recurrence: "monthly" as Exclude<BillRecurrence, "none">,
  recurrence_end_date: "",
  is_active: true,
};

type BillFormState = typeof DEFAULT_BILL_FORM;
type BillFormErrors = Partial<Record<keyof BillFormState, string>>;

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatShortDate(value: string) {
  const date = parseDateKey(value);
  if (!date) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return currencyFormatter.format(value);
}

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

function formatDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = parseDateKey(value.slice(0, 10));
  if (!date) return "-";
  return date
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return "-";
  return compactCurrencyFormatter.format(value);
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function normalizeOfferName(value: string) {
  return value.length > 34 ? `${value.slice(0, 31)}...` : value;
}

function getEmployeePaymentStatusMeta(status: EmployeePaymentStatus) {
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
      icon: Ban,
      className: "bg-muted text-muted-foreground",
    };
  }

  return {
    label: "Pendente",
    icon: Clock,
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
}

function getEmployeePaymentRoleMeta(role?: EmployeePaymentRole) {
  if (role === "teacher") {
    return {
      label: "Professor",
      icon: GraduationCap,
      className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  if (role === "manager") {
    return {
      label: "Gerente",
      icon: ShieldCheck,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  if (role === "administrative") {
    return {
      label: "Administrativo",
      icon: UserCog,
      className: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }

  return null;
}

function validateEmployeePaymentForm(values: EmployeePaymentFormState) {
  const errors: EmployeePaymentFormErrors = {};
  const amount = normalizeMoneyInput(values.amount);

  if (!values.employee) {
    errors.employee = "Selecione um funcionario.";
  }

  if (!amount) {
    errors.amount = "Informe um valor maior que zero.";
  }

  if (!values.due_date) {
    errors.due_date = "Informe o vencimento.";
  }

  if (!values.description.trim()) {
    errors.description = "Informe uma descricao.";
  }

  if (!values.competence_month) {
    errors.competence_month = "Informe o mes de competencia.";
  }

  if (values.is_recurring && !values.recurrence_end_date) {
    errors.recurrence_end_date = "Informe a data final da recorrencia.";
  }

  return { errors, amount };
}

function validateBillForm(values: BillFormState) {
  const errors: BillFormErrors = {};
  const amount = normalizeMoneyInput(values.amount);

  if (!values.name.trim()) {
    errors.name = "Informe o nome da conta.";
  }

  if (!values.category.trim()) {
    errors.category = "Informe a categoria.";
  }

  if (!amount) {
    errors.amount = "Informe um valor maior que zero.";
  }

  if (!values.due_date) {
    errors.due_date = "Informe o vencimento.";
  }

  if (!values.competence_month) {
    errors.competence_month = "Informe o mes de competencia.";
  }

  if (!values.description.trim()) {
    errors.description = "Informe uma descricao.";
  }

  if (values.is_recurring && !values.recurrence_end_date) {
    errors.recurrence_end_date = "Informe a data final da recorrencia.";
  }

  return { errors, amount };
}

function EmployeePaymentsPanel({
  items,
  totalAmount,
  totalCount,
  isLoading,
  isError,
  onCreate,
}: {
  items: EmployeePayment[];
  totalAmount?: string;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  onCreate: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Pagamentos de funcionarios</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalCount} pagamento{totalCount === 1 ? "" : "s"} ·{" "}
            {formatCurrencyString(totalAmount)}
          </p>
        </div>
        <Button type="button" size="sm" className="rounded-2xl" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Nao foi possivel carregar os pagamentos de funcionarios.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum pagamento de funcionario encontrado no periodo.
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <ul className="divide-y divide-border/80">
            {items.map((item) => (
              <EmployeePaymentRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmployeePaymentRow({ item }: { item: EmployeePayment }) {
  const status = getEmployeePaymentStatusMeta(item.status);
  const StatusIcon = status.icon;
  const role = getEmployeePaymentRoleMeta(item.role ?? item.employee_detail.role);
  const RoleIcon = role?.icon;
  const employeeName =
    `${item.employee_detail.first_name} ${item.employee_detail.last_name}`.trim();

  return (
    <li className="py-2">
      <Link
        href={`/billing/employee-payments/${item.id}`}
        className="grid gap-3 rounded-[1.35rem] border border-transparent bg-background/60 px-3 py-3 transition-all hover:border-orange-500/20 hover:bg-orange-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {employeeName || item.employee_detail.email}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                status.className,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
            {role && RoleIcon && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  role.className,
                )}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {role.label}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vencimento {formatDateLabel(item.due_date)}
          </p>
        </div>
        <p className="text-right text-base font-semibold text-foreground">
          {formatCurrencyString(item.amount)}
        </p>
      </Link>
    </li>
  );
}

function getBillStatusMeta(status: Bill["status"]) {
  const map = {
    pending: {
      label: "Pendente",
      className: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
      icon: Clock,
    },
    paid: {
      label: "Pago",
      className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle,
    },
    canceled: {
      label: "Cancelado",
      className: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
      icon: Ban,
    },
  } as const;

  return map[status] ?? map.pending;
}

function BillsPanel({
  items,
  totalCount,
  totalAmount,
  isLoading,
  isError,
  onCreate,
}: {
  items: Bill[];
  totalCount: number;
  totalAmount: number;
  isLoading: boolean;
  isError: boolean;
  onCreate: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Contas</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalCount} conta{totalCount === 1 ? "" : "s"} · {formatCurrency(totalAmount)}
          </p>
        </div>
        <Button type="button" size="sm" className="rounded-2xl" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Nao foi possivel carregar as contas.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma conta encontrada no periodo.
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <ul className="divide-y divide-border/80">
            {items.map((item) => (
              <BillRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BillRow({ item }: { item: Bill }) {
  const status = getBillStatusMeta(item.status);
  const StatusIcon = status.icon;

  return (
    <li className="py-2">
      <Link
        href={`/billing/bills/${item.id}`}
        className="grid gap-3 rounded-[1.35rem] border border-transparent bg-background/60 px-3 py-3 transition-all hover:border-orange-500/20 hover:bg-orange-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                status.className,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Vencimento {formatDateLabel(item.due_date)}
          </p>
        </div>
        <p className="text-right text-base font-semibold text-foreground">
          {formatCurrencyString(item.amount)}
        </p>
      </Link>
    </li>
  );
}

function FloatingCreateButton({
  isOpen,
  onToggle,
  onCreateBill,
  onCreateEmployeePayment,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onCreateBill: () => void;
  onCreateEmployeePayment: () => void;
}) {
  return (
    <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
      {isOpen && (
        <div className="flex flex-col items-end gap-2">
          <FloatingActionOption
            label="Criar conta"
            icon={<Receipt className="h-4 w-4" />}
            onClick={onCreateBill}
          />
          <FloatingActionOption
            label="Criar remuneração"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={onCreateEmployeePayment}
          />
          <FloatingActionOption
            label="Criar pagamento"
            icon={<CreditCard className="h-4 w-4" />}
            disabled
          />
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={isOpen ? "Fechar acoes" : "Abrir acoes"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}

function FloatingActionOption({
  label,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-700">
        {icon}
      </span>
      {label}
    </button>
  );
}

export function BillingDashboardPage() {
  const currentMonth = useMemo(() => getCurrentMonthValue(), []);
  const [month, setMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isEmployeePaymentModalOpen, setIsEmployeePaymentModalOpen] = useState(false);
  const [billForm, setBillForm] = useState<BillFormState>(DEFAULT_BILL_FORM);
  const [billErrors, setBillErrors] = useState<BillFormErrors>({});
  const [employeePaymentForm, setEmployeePaymentForm] = useState<EmployeePaymentFormState>(
    DEFAULT_EMPLOYEE_PAYMENT_FORM,
  );
  const [employeePaymentErrors, setEmployeePaymentErrors] = useState<EmployeePaymentFormErrors>({});
  const [appliedParams, setAppliedParams] = useState<BillingSummaryParams>({
    overview: true,
  });

  const { data, isLoading, isError, isFetching } = useBillingSummary(appliedParams);
  const employeePaymentsParams = useMemo(
    () =>
      appliedParams.overview
        ? { month: currentMonth }
        : {
            month: appliedParams.month,
            start_date: appliedParams.start_date,
            end_date: appliedParams.end_date,
          },
    [appliedParams, currentMonth],
  );
  const {
    data: employeePaymentsData,
    isLoading: isEmployeePaymentsLoading,
    isError: isEmployeePaymentsError,
  } = useEmployeePaymentsSummary(employeePaymentsParams);
  const {
    data: billsData,
    isLoading: isBillsLoading,
    isError: isBillsError,
  } = useBills(employeePaymentsParams);
  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployeePaymentsEmployees();
  const createBill = useCreateBill();
  const createEmployeePayment = useCreateEmployeePayment();
  const totals = data?.totals;
  const billedByOffer = data?.billed_amount_by_offer ?? [];
  const employeePayments = employeePaymentsData?.employee_payments ?? [];
  const bills = billsData?.results ?? [];
  const hasActiveFilter = !appliedParams.overview;
  const cashAmount =
    totals?.caixa ??
    data?.caixa ??
    (totals?.total_billed_amount ?? 0) - (totals?.total_expenses_amount ?? 0);

  const metrics = [
    {
      title: "Caixa",
      value: formatCurrency(cashAmount),
      helperLabel: "Receita - despesas",
      helperValue: hasActiveFilter ? "Periodo filtrado" : "Acumulado dos meses",
      icon: HandCoins,
      cardClass:
        "border-teal-200/80 bg-card text-teal-950 hover:border-teal-500/25 hover:bg-teal-500/[0.04] dark:border-teal-500/20 dark:text-teal-50",
      gradientClass:
        "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.12),transparent_26%)]",
      iconClass: "bg-teal-200/70 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
    },
    {
      title: "Receita",
      value: formatCurrency(totals?.total_billed_amount),
      helperLabel: "Disponivel sem taxas",
      helperValue: formatCurrency(totals?.asaas_amount_gross),
      icon: CircleDollarSign,
      cardClass:
        "border-emerald-200/80 bg-card text-emerald-950 hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] dark:border-emerald-500/20 dark:text-emerald-50",
      gradientClass:
        "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(52,211,153,0.14),transparent_26%)]",
      iconClass: "bg-emerald-200/70 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
    {
      title: "Despesa",
      value: formatCurrency(totals?.total_expenses_amount),
      helperLabel: "Contas e pagamentos",
      helperValue: formatCurrency(
        (totals?.bills_amount ?? 0) + (totals?.employee_payments_amount ?? 0),
      ),
      icon: Wallet,
      cardClass:
        "border-rose-200/80 bg-card text-rose-950 hover:border-rose-500/25 hover:bg-rose-500/[0.04] dark:border-rose-500/20 dark:text-rose-50",
      gradientClass:
        "bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(251,113,133,0.12),transparent_26%)]",
      iconClass: "bg-rose-200/70 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
    },
    {
      title: "Ordens pagas",
      value: numberFormatter.format(totals?.paid_orders_count ?? 0),
      helperLabel: "Pagamentos pagos",
      helperValue: numberFormatter.format(totals?.paid_payments_count ?? 0),
      icon: ClipboardCheck,
      cardClass:
        "border-blue-200/80 bg-card text-blue-950 hover:border-blue-500/25 hover:bg-blue-500/[0.04] dark:border-blue-500/20 dark:text-blue-50",
      gradientClass:
        "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(96,165,250,0.13),transparent_26%)]",
      iconClass: "bg-blue-200/70 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200",
    },
  ] as const;

  const periodLabel = hasActiveFilter
    ? [
        appliedParams.month ? formatMonthLabel(appliedParams.month) : null,
        appliedParams.start_date && appliedParams.end_date
          ? `${appliedParams.start_date} ate ${appliedParams.end_date}`
          : appliedParams.start_date
            ? `A partir de ${appliedParams.start_date}`
            : appliedParams.end_date
              ? `Ate ${appliedParams.end_date}`
              : null,
      ]
        .filter(Boolean)
        .join(" / ") || "Filtro aplicado"
    : "Visao geral";

  function handleUseCurrentMonth() {
    setMonth(currentMonth);
  }

  function handleApplyFilters() {
    if (startDate && endDate && endDate < startDate) {
      setFilterError("A data final nao pode ser anterior a data de inicio.");
      return;
    }

    setFilterError(null);
    setAppliedParams({
      month: month || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    setIsFilterOpen(false);
  }

  function handleClearFilters() {
    setMonth(currentMonth);
    setStartDate("");
    setEndDate("");
    setFilterError(null);
    setAppliedParams({ overview: true });
    setIsFilterOpen(false);
  }

  function openEmployeePaymentModal() {
    setEmployeePaymentForm({
      ...DEFAULT_EMPLOYEE_PAYMENT_FORM,
      competence_month: `${month || currentMonth}-01`,
    });
    setEmployeePaymentErrors({});
    createEmployeePayment.reset();
    setIsEmployeePaymentModalOpen(true);
    setIsFabOpen(false);
  }

  function openBillModal() {
    setBillForm({
      ...DEFAULT_BILL_FORM,
      competence_month: month || currentMonth,
    });
    setBillErrors({});
    createBill.reset();
    setIsBillModalOpen(true);
    setIsFabOpen(false);
  }

  function closeBillModal() {
    if (createBill.isPending) return;
    setIsBillModalOpen(false);
    setBillErrors({});
    createBill.reset();
  }

  function updateBillForm<Key extends keyof BillFormState>(key: Key, value: BillFormState[Key]) {
    setBillForm((current) => ({ ...current, [key]: value }));
    setBillErrors((current) => ({ ...current, [key]: undefined }));
  }

  function closeEmployeePaymentModal() {
    if (createEmployeePayment.isPending) return;
    setIsEmployeePaymentModalOpen(false);
    setEmployeePaymentErrors({});
    createEmployeePayment.reset();
  }

  function updateEmployeePaymentForm<Key extends keyof EmployeePaymentFormState>(
    key: Key,
    value: EmployeePaymentFormState[Key],
  ) {
    setEmployeePaymentForm((current) => ({ ...current, [key]: value }));
    setEmployeePaymentErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleCreateEmployeePayment() {
    const { errors, amount } = validateEmployeePaymentForm(employeePaymentForm);
    setEmployeePaymentErrors(errors);

    if (Object.keys(errors).length > 0 || !amount) {
      return;
    }

    const payload: CreateEmployeePaymentPayload = {
      employee: Number(employeePaymentForm.employee),
      amount,
      due_date: employeePaymentForm.due_date,
      status: employeePaymentForm.status,
      description: employeePaymentForm.description.trim(),
      competence_month: employeePaymentForm.competence_month,
      is_recurring: employeePaymentForm.is_recurring,
      recurrence: employeePaymentForm.is_recurring ? "monthly" : "none",
      recurrence_end_date: employeePaymentForm.is_recurring
        ? employeePaymentForm.recurrence_end_date
        : null,
    };

    try {
      await createEmployeePayment.mutateAsync(payload);
      closeEmployeePaymentModal();
    } catch {
      // The mutation state drives the visible error message in the modal.
    }
  }

  async function handleCreateBill() {
    const { errors, amount } = validateBillForm(billForm);
    setBillErrors(errors);

    if (Object.keys(errors).length > 0 || !amount) {
      return;
    }

    const payload = {
      name: billForm.name.trim(),
      category: billForm.category.trim(),
      kind: billForm.kind,
      amount,
      due_date: billForm.due_date,
      status: billForm.status,
      competence_month: `${billForm.competence_month}-01`,
      description: billForm.description.trim(),
      is_recurring: billForm.is_recurring,
      ...(billForm.is_recurring
        ? {
            recurrence: billForm.recurrence,
            recurrence_end_date: billForm.recurrence_end_date,
          }
        : {}),
      is_active: billForm.is_active,
    };

    try {
      await createBill.mutateAsync(payload);
      closeBillModal();
    } catch {
      // The mutation state drives the visible error message in the modal.
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Financeiro
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Faturamento
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {periodLabel}
              </span>
              {isFetching && !isLoading && (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Atualizando
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex items-start xl:justify-end">
          <Button
            type="button"
            variant={hasActiveFilter ? "default" : "outline"}
            onClick={() => setIsFilterOpen((current) => !current)}
            className="w-full sm:w-auto"
            aria-expanded={isFilterOpen}
          >
            <Filter className="h-4 w-4" />
            Filtro
          </Button>

          {isFilterOpen && (
            <>
              <div className="absolute right-0 top-12 z-30 hidden w-[680px] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl md:block">
                <FilterPanel
                  idPrefix="desktop"
                  month={month}
                  startDate={startDate}
                  endDate={endDate}
                  filterError={filterError}
                  hasActiveFilter={hasActiveFilter}
                  onMonthChange={setMonth}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onUseCurrentMonth={handleUseCurrentMonth}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                  onClose={() => setIsFilterOpen(false)}
                />
              </div>

              <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-3 md:hidden">
                <button
                  type="button"
                  className="absolute inset-0"
                  aria-label="Fechar filtro"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card p-4 text-card-foreground shadow-xl">
                  <FilterPanel
                    idPrefix="mobile"
                    month={month}
                    startDate={startDate}
                    endDate={endDate}
                    filterError={filterError}
                    hasActiveFilter={hasActiveFilter}
                    onMonthChange={setMonth}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onUseCurrentMonth={handleUseCurrentMonth}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    onClose={() => setIsFilterOpen(false)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nao foi possivel carregar o dashboard de faturamento. Tente novamente.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <BillingMetricCard
            key={metric.title}
            title={metric.title}
            value={isLoading ? "..." : metric.value}
            helperLabel={metric.helperLabel}
            helperValue={isLoading ? "..." : metric.helperValue}
            icon={<metric.icon className="h-5 w-5" />}
            cardClass={metric.cardClass}
            gradientClass={metric.gradientClass}
            iconClass={metric.iconClass}
          />
        ))}
      </div>

      <MonthlyPlanPaymentsChart month={appliedParams.month ?? currentMonth} />

      <Card>
        <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Faturamento por oferta</CardTitle>
            <p className="text-sm text-muted-foreground">
              {billedByOffer.length} oferta{billedByOffer.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Banknote className="h-3.5 w-3.5" />
            Receita por oferta
          </span>
        </CardHeader>
        <CardContent>
          <OfferBillingChart items={billedByOffer} isLoading={isLoading} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeePaymentsPanel
          items={employeePayments}
          totalAmount={employeePaymentsData?.totals.total_amount}
          totalCount={employeePaymentsData?.totals.count ?? 0}
          isLoading={isEmployeePaymentsLoading}
          isError={isEmployeePaymentsError}
          onCreate={openEmployeePaymentModal}
        />

        <BillsPanel
          items={bills}
          totalCount={billsData?.count ?? totals?.bills_count ?? 0}
          totalAmount={
            bills.length > 0
              ? bills.reduce((total, item) => total + Number(item.amount || 0), 0)
              : (totals?.bills_amount ?? 0)
          }
          isLoading={isBillsLoading}
          isError={isBillsError}
          onCreate={openBillModal}
        />
      </div>

      <FloatingCreateButton
        isOpen={isFabOpen}
        onToggle={() => setIsFabOpen((current) => !current)}
        onCreateBill={openBillModal}
        onCreateEmployeePayment={openEmployeePaymentModal}
      />

      {isBillModalOpen && (
        <BillModal
          values={billForm}
          errors={billErrors}
          isSubmitting={createBill.isPending}
          submitError={createBill.isError ? "Nao foi possivel criar a conta." : null}
          onChange={updateBillForm}
          onClose={closeBillModal}
          onSubmit={handleCreateBill}
        />
      )}

      {isEmployeePaymentModalOpen && (
        <EmployeePaymentModal
          values={employeePaymentForm}
          errors={employeePaymentErrors}
          employees={employees}
          isEmployeesLoading={isEmployeesLoading}
          isSubmitting={createEmployeePayment.isPending}
          submitError={createEmployeePayment.isError ? "Nao foi possivel criar o pagamento." : null}
          onChange={updateEmployeePaymentForm}
          onClose={closeEmployeePaymentModal}
          onSubmit={handleCreateEmployeePayment}
        />
      )}
    </section>
  );
}

function BillModal({
  values,
  errors,
  isSubmitting,
  submitError,
  onChange,
  onClose,
  onSubmit,
}: {
  values: BillFormState;
  errors: BillFormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  onChange: <Key extends keyof BillFormState>(key: Key, value: BillFormState[Key]) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const kindOptions: Array<{ label: string; value: BillKind; icon: typeof Repeat }> = [
    { label: "Fixa", value: "fixed", icon: Repeat },
    { label: "Imprevisivel", value: "unexpected", icon: CircleAlert },
  ];
  const recurrenceOptions: Array<{
    label: string;
    value: Exclude<BillRecurrence, "none">;
  }> = [
    { label: "Mensal", value: "monthly" },
    { label: "Quinzenal", value: "biweekly" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:items-center sm:justify-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar criacao de conta"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Financeiro
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Criar conta</h2>
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Nome da conta" error={errors.name}>
            <Input
              value={values.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Aluguel"
            />
          </FieldWrapper>

          <FieldWrapper label="Categoria" error={errors.category}>
            <Input
              value={values.category}
              onChange={(event) => onChange("category", event.target.value)}
              placeholder="estrutura"
            />
          </FieldWrapper>

          <FieldWrapper label="Tipo" error={errors.kind}>
            <div className="grid grid-cols-2 gap-2">
              {kindOptions.map((option) => (
                <BillOptionButton
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={values.kind === option.value}
                  onClick={() => onChange("kind", option.value)}
                />
              ))}
            </div>
          </FieldWrapper>

          <FieldWrapper label="Valor" error={errors.amount}>
            <Input
              type="text"
              inputMode="numeric"
              value={values.amount}
              onChange={(event) => onChange("amount", formatMoneyInput(event.target.value))}
              placeholder="1.500,00"
            />
          </FieldWrapper>

          <FieldWrapper label="Vencimento" error={errors.due_date}>
            <Input
              type="date"
              value={values.due_date}
              onChange={(event) => onChange("due_date", event.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Status" error={errors.status}>
            <select
              value={values.status}
              onChange={(event) => onChange("status", event.target.value as BillStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="canceled">Cancelado</option>
            </select>
          </FieldWrapper>

          <FieldWrapper label="Competencia" error={errors.competence_month}>
            <Input
              type="month"
              value={values.competence_month}
              onChange={(event) => onChange("competence_month", event.target.value)}
            />
          </FieldWrapper>

          <div className="space-y-2">
            <Label>Pagamento recorrente</Label>
            <button
              type="button"
              onClick={() => onChange("is_recurring", !values.is_recurring)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors",
                values.is_recurring
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground",
              )}
            >
              <span>{values.is_recurring ? "Recorrente" : "Nao recorrente"}</span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  values.is_recurring ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    values.is_recurring ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </span>
            </button>
          </div>

          {values.is_recurring && (
            <>
              <FieldWrapper label="Recorrencia" error={errors.recurrence}>
                <div className="grid grid-cols-2 gap-2">
                  {recurrenceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange("recurrence", option.value)}
                      className={cn(
                        "h-10 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        values.recurrence === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FieldWrapper>

              <FieldWrapper label="Final da recorrencia" error={errors.recurrence_end_date}>
                <Input
                  type="date"
                  value={values.recurrence_end_date}
                  onChange={(event) => onChange("recurrence_end_date", event.target.value)}
                />
              </FieldWrapper>
            </>
          )}

          <div className="space-y-2 sm:col-span-2">
            <FieldWrapper label="Descricao" error={errors.description}>
              <Input
                value={values.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Aluguel mensal"
              />
            </FieldWrapper>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar conta
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillOptionButton({
  label,
  icon: Icon,
  isSelected,
  onClick,
}: {
  label: string;
  icon: typeof Repeat;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EmployeePaymentModal({
  values,
  errors,
  employees,
  isEmployeesLoading,
  isSubmitting,
  submitError,
  onChange,
  onClose,
  onSubmit,
}: {
  values: EmployeePaymentFormState;
  errors: EmployeePaymentFormErrors;
  employees: Array<{ id: number; full_name: string }>;
  isEmployeesLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onChange: <Key extends keyof EmployeePaymentFormState>(
    key: Key,
    value: EmployeePaymentFormState[Key],
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:items-center sm:justify-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar criacao de pagamento"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Financeiro
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Criar pagamento de funcionario
            </h2>
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Funcionario" error={errors.employee}>
            <select
              value={values.employee}
              onChange={(event) => onChange("employee", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isEmployeesLoading}
            >
              <option value="">
                {isEmployeesLoading ? "Carregando funcionarios..." : "Selecione"}
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Valor" error={errors.amount}>
            <Input
              type="text"
              inputMode="numeric"
              value={values.amount}
              onChange={(event) => onChange("amount", formatMoneyInput(event.target.value))}
              placeholder="800,00"
            />
          </FieldWrapper>

          <FieldWrapper label="Vencimento" error={errors.due_date}>
            <Input
              type="date"
              value={values.due_date}
              onChange={(event) => onChange("due_date", event.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper label="Status" error={errors.status}>
            <select
              value={values.status}
              onChange={(event) => onChange("status", event.target.value as EmployeePaymentStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="canceled">Cancelado</option>
            </select>
          </FieldWrapper>

          <FieldWrapper label="Competencia" error={errors.competence_month}>
            <Input
              type="date"
              value={values.competence_month}
              onChange={(event) => onChange("competence_month", event.target.value)}
            />
          </FieldWrapper>

          <div className="space-y-2">
            <Label>Recorrente</Label>
            <button
              type="button"
              onClick={() => onChange("is_recurring", !values.is_recurring)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors",
                values.is_recurring
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground",
              )}
            >
              <span>{values.is_recurring ? "Mensal" : "Nao recorrente"}</span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  values.is_recurring ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    values.is_recurring ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </span>
            </button>
          </div>

          {values.is_recurring && (
            <FieldWrapper label="Final da recorrencia" error={errors.recurrence_end_date}>
              <Input
                type="date"
                value={values.recurrence_end_date}
                onChange={(event) => onChange("recurrence_end_date", event.target.value)}
              />
            </FieldWrapper>
          )}

          <div className="space-y-2 sm:col-span-2">
            <FieldWrapper label="Descricao" error={errors.description}>
              <Input
                value={values.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Pagamento mensal professor"
              />
            </FieldWrapper>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FilterPanel({
  idPrefix,
  month,
  startDate,
  endDate,
  filterError,
  hasActiveFilter,
  onMonthChange,
  onStartDateChange,
  onEndDateChange,
  onUseCurrentMonth,
  onApply,
  onClear,
  onClose,
}: {
  idPrefix: string;
  month: string;
  startDate: string;
  endDate: string;
  filterError: string | null;
  hasActiveFilter: boolean;
  onMonthChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onUseCurrentMonth: () => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const rangeLabel =
    startDate && endDate
      ? `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`
      : startDate
        ? `${formatShortDate(startDate)} - selecionar fim`
        : "Selecione inicio e fim";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Filtrar periodo</p>
          <p className="text-xs text-muted-foreground">Mes e intervalo de datas</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Fechar filtro"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-billing-month`}>Mês</Label>
          <Input
            id={`${idPrefix}-billing-month`}
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Intervalo</Label>
          <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground">
            {rangeLabel}
          </div>
          <DateRangePicker
            key={month}
            startDate={startDate}
            endDate={endDate}
            month={month}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </div>
      </div>

      <p className="min-h-5 text-sm text-destructive">{filterError}</p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={onUseCurrentMonth}>
          <CalendarDays className="h-4 w-4" />
          Mês atual
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {hasActiveFilter && (
            <Button type="button" variant="ghost" onClick={onClear}>
              Limpar
            </Button>
          )}
          <Button type="button" onClick={onApply}>
            <RefreshCw className="h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  month,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  month: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  const initialVisibleMonth = useMemo(() => {
    const selectedStart = parseDateKey(startDate);
    if (selectedStart) return new Date(selectedStart.getFullYear(), selectedStart.getMonth(), 1);

    const [year, monthIndex] = month.split("-").map(Number);
    const monthDate = new Date(year, monthIndex - 1, 1);
    return Number.isNaN(monthDate.getTime())
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : monthDate;
  }, [month, startDate]);
  const [visibleMonth, setVisibleMonth] = useState(initialVisibleMonth);
  const selectedStart = startDate ? parseDateKey(startDate) : null;
  const selectedEnd = endDate ? parseDateKey(endDate) : null;
  const secondMonth = useMemo(() => addMonths(visibleMonth, 1), [visibleMonth]);

  function handleSelectDate(date: Date) {
    const selectedKey = getDateKey(date);

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onStartDateChange(selectedKey);
      onEndDateChange("");
      return;
    }

    if (date < selectedStart) {
      onStartDateChange(selectedKey);
      onEndDateChange(getDateKey(selectedStart));
      return;
    }

    onEndDateChange(selectedKey);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          aria-label="Proximo mes"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CalendarMonth
          monthDate={visibleMonth}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          onSelectDate={handleSelectDate}
        />
        <div className="hidden md:block">
          <CalendarMonth
            monthDate={secondMonth}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>
    </div>
  );
}

function CalendarMonth({
  monthDate,
  selectedStart,
  selectedEnd,
  onSelectDate,
}: {
  monthDate: Date;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const days = useMemo(() => getCalendarDays(monthDate), [monthDate]);
  const selectedStartKey = selectedStart ? getDateKey(selectedStart) : null;
  const selectedEndKey = selectedEnd ? getDateKey(selectedEnd) : null;

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold capitalize text-foreground">
        {monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date) => {
          const dateKey = getDateKey(date);
          const isOutsideMonth = date.getMonth() !== monthDate.getMonth();
          const isRangeStart = selectedStartKey === dateKey;
          const isRangeEnd = selectedEndKey === dateKey;
          const isInRange =
            selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex h-9 items-center justify-center text-sm transition-colors hover:bg-orange-500/[0.08]",
                isOutsideMonth && "text-muted-foreground/40",
                isInRange && "bg-orange-500/[0.08]",
                (isRangeStart || isRangeEnd) && "bg-orange-500 text-white hover:bg-orange-600",
                isRangeStart && selectedEnd && "rounded-l-full",
                isRangeEnd && selectedStart && "rounded-r-full",
                ((!isInRange && !isRangeStart && !isRangeEnd) ||
                  (isRangeStart && !selectedEnd) ||
                  (isRangeEnd && !selectedStart)) &&
                  "rounded-full",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BillingMetricCard({
  title,
  value,
  helperLabel,
  helperValue,
  icon,
  cardClass,
  gradientClass,
  iconClass,
}: {
  title: string;
  value: string;
  helperLabel: string;
  helperValue: string;
  icon: ReactNode;
  cardClass: string;
  gradientClass: string;
  iconClass: string;
}) {
  return (
    <Card
      className={cn("relative overflow-hidden rounded-[2rem] shadow-sm transition-all", cardClass)}
    >
      <div className={cn("absolute inset-0", gradientClass)} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-white/65">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-xl",
              iconClass,
            )}
          >
            {icon}
          </span>
        </div>
        <div className="mt-5 rounded-lg border border-white/55 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs text-slate-600 dark:text-white/60">{helperLabel}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{helperValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OfferBillingChart({
  items,
  isLoading,
}: {
  items: BillingAmountByOffer[];
  isLoading: boolean;
}) {
  const chartData = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        short_offer_name: normalizeOfferName(item.offer_name),
      })),
    [items],
  );

  if (isLoading) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Carregando faturamento por oferta...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Nenhuma oferta com faturamento no periodo.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tickFormatter={formatCompactCurrency}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="short_offer_name"
            width={170}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.offer_name ?? ""}
            contentStyle={{
              borderRadius: 8,
              borderColor: "hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Bar
            dataKey="total_billed_amount"
            name="Faturamento"
            fill="hsl(var(--primary))"
            radius={[0, 8, 8, 0]}
            barSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
