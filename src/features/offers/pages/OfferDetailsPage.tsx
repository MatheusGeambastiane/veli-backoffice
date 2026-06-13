"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Edit3,
  Plus,
  QrCode,
  Save,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  useOfferCampaignsSimple,
  useOfferDetails,
  useOfferStudentClassesSimple,
  useUpdateOffer,
} from "@/features/offers/queries/offersQueries";
import type {
  BillingCycle,
  BillingOptionCode,
  BillingOptionPayload,
  OfferBillingOption,
  OfferDetail,
  OfferOrdersByBillingOption,
} from "@/features/offers/types/offer";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
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

type BillingType = "one_time" | "recurring";
type BillingMethod = "pix" | "credit_card";
type CashDiscountType = "fixed" | "percent";

type OfferEditFormState = {
  name: string;
  price: string;
  campaignId: number | "";
  studentClassIds: number[];
  allowCashDiscount: boolean;
  cashDiscountType: CashDiscountType | "";
  cashDiscountValue: string;
  billingOptions: BillingOptionPayload[];
};

type OfferEditErrors = Partial<
  Record<
    | "name"
    | "price"
    | "campaignId"
    | "studentClassIds"
    | "cashDiscountType"
    | "cashDiscountValue"
    | "billingOptions",
    string
  >
>;

type BillingDraft = {
  type: BillingType;
  billingMethod: BillingMethod;
  cycle: Exclude<BillingCycle, "none">;
  price: string;
  maxInstallments: number | "";
  isActive: boolean;
};

const DEFAULT_BILLING_DRAFT: BillingDraft = {
  type: "recurring",
  billingMethod: "pix",
  cycle: "monthly",
  price: "",
  maxInstallments: "",
  isActive: true,
};

const CYCLE_OPTIONS: Array<{ value: Exclude<BillingCycle, "none">; label: string }> = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semi_annual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return currencyFormatter.format(parsed);
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return currencyFormatter.format(amount);
}

function apiValueToCurrencyInput(value?: string | number | null) {
  if (value === null || typeof value === "undefined" || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "";
  return currencyFormatter.format(parsed);
}

function currencyInputToApiValue(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}

function normalizeDecimalInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integer = "", ...fractionParts] = normalized.split(".");
  const fraction = fractionParts.join("").slice(0, 2);
  if (!integer && !fraction) return "";
  return fractionParts.length > 0 ? `${integer || "0"}.${fraction}` : integer;
}

function buildInstallmentRange(limit: number) {
  return Array.from({ length: limit }, (_, index) => index + 1);
}

function codeFromBillingOption(params: {
  type: BillingType;
  billingMethod: BillingMethod;
  cycle: BillingCycle;
}): BillingOptionCode {
  if (params.type === "one_time") {
    return params.billingMethod === "pix" ? "UPFRONT_PIX" : "UPFRONT_CREDIT_CARD";
  }

  const cyclePrefix = {
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    semi_annual: "SEMI_ANNUAL",
    annual: "ANNUAL",
    none: "UPFRONT",
  }[params.cycle];
  const methodSuffix = params.billingMethod === "pix" ? "PIX" : "CREDIT_CARD";
  return `${cyclePrefix}_${methodSuffix}` as BillingOptionCode;
}

function derivePaymentMode(options: BillingOptionPayload[]) {
  const modes = new Set<"one_time" | "monthly">();
  options.forEach((option) => {
    if (option.type === "recurring") modes.add("monthly");
    if (option.type === "one_time") modes.add("one_time");
  });
  return Array.from(modes);
}

function planTypeFromBillingOptions(options: BillingOptionPayload[]) {
  return options.some((option) => option.type === "recurring") ? "monthly" : "one_time";
}

function createFormState(data: OfferDetail): OfferEditFormState {
  return {
    name: data.name,
    price: apiValueToCurrencyInput(data.price),
    campaignId: data.campaign?.id ?? "",
    studentClassIds: data.student_classes.map((studentClass) => studentClass.id),
    allowCashDiscount: data.allow_cash_discount,
    cashDiscountType:
      data.cash_discount_type === "fixed" || data.cash_discount_type === "percent"
        ? data.cash_discount_type
        : "",
    cashDiscountValue: data.cash_discount_value ?? "",
    billingOptions: data.billing_options.map((option) => ({
      code: option.code,
      type: option.type === "recurring" ? "recurring" : "one_time",
      cycle:
        option.type === "one_time"
          ? "none"
          : option.cycle === "quarterly" ||
              option.cycle === "semi_annual" ||
              option.cycle === "annual" ||
              option.cycle === "monthly"
            ? option.cycle
            : "monthly",
      billing_method: option.billing_method === "credit_card" ? "credit_card" : "pix",
      price: option.price,
      allowed_installments: option.allowed_installments ?? [],
      is_active: option.is_active ?? true,
    })),
  };
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
  if (value === "quarterly") return "Trimestral";
  if (value === "semi_annual") return "Semestral";
  if (value === "annual") return "Anual";
  if (value === "none") return "Sem ciclo";
  return value || "-";
}

function billingOptionCodeLabel(code?: string | null) {
  if (code === "UPFRONT_CREDIT_CARD") return "Unico por cartao de credito";
  if (code === "MONTHLY_CREDIT_CARD") return "Mensal por cartao de credito";
  if (code === "QUARTERLY_CREDIT_CARD") return "Trimestral por cartao de credito";
  if (code === "SEMI_ANNUAL_CREDIT_CARD") return "Semestral por cartao de credito";
  if (code === "ANNUAL_CREDIT_CARD") return "Anual por cartao de credito";
  if (code === "UPFRONT_PIX") return "Pix unico";
  if (code === "MONTHLY_PIX") return "Pix mensal";
  if (code === "QUARTERLY_PIX") return "Pix trimestral";
  if (code === "SEMI_ANNUAL_PIX") return "Pix semestral";
  if (code === "ANNUAL_PIX") return "Pix anual";
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
  const { data: campaigns, isLoading: isLoadingCampaigns } = useOfferCampaignsSimple();
  const { data: studentClasses, isLoading: isLoadingStudentClasses } = useOfferStudentClassesSimple();
  const updateOffer = useUpdateOffer(offerId);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<OfferEditFormState | null>(null);
  const [errors, setErrors] = useState<OfferEditErrors>({});

  useEffect(() => {
    if (data && !isEditing) {
      setFormState(createFormState(data));
      setErrors({});
    }
  }, [data, isEditing]);

  const campaignOptions = useMemo(() => campaigns ?? [], [campaigns]);
  const studentClassOptions = useMemo(() => studentClasses ?? [], [studentClasses]);

  function startEditing() {
    if (!data) return;
    setFormState(createFormState(data));
    setErrors({});
    setIsEditing(true);
  }

  function cancelEditing() {
    if (data) {
      setFormState(createFormState(data));
    }
    setErrors({});
    setIsEditing(false);
  }

  function validateForm(state: OfferEditFormState) {
    const nextErrors: OfferEditErrors = {};
    const normalizedPrice = currencyInputToApiValue(state.price);

    if (!state.name.trim()) {
      nextErrors.name = "Informe o nome da oferta.";
    }
    if (!normalizedPrice || Number(normalizedPrice) <= 0) {
      nextErrors.price = "Informe um preco maior que zero.";
    }
    if (!state.campaignId) {
      nextErrors.campaignId = "Selecione uma campanha.";
    }
    if (state.studentClassIds.length === 0) {
      nextErrors.studentClassIds = "Selecione ao menos uma turma.";
    }
    if (state.allowCashDiscount && !state.cashDiscountType) {
      nextErrors.cashDiscountType = "Selecione o tipo de desconto.";
    }
    if (
      state.allowCashDiscount &&
      (!state.cashDiscountValue || Number(state.cashDiscountValue) <= 0)
    ) {
      nextErrors.cashDiscountValue = "Informe um valor de desconto maior que zero.";
    }
    if (state.billingOptions.length === 0) {
      nextErrors.billingOptions = "Adicione pelo menos uma opcao de pagamento.";
    }

    const hasInvalidBillingOption = state.billingOptions.some((option) => {
      const invalidPrice = !option.price || Number(option.price) <= 0;
      const invalidInstallments =
        option.billing_method === "credit_card" && option.allowed_installments.length === 0;
      return invalidPrice || invalidInstallments;
    });

    if (hasInvalidBillingOption) {
      nextErrors.billingOptions = "Revise preco e parcelas das opcoes de cartao.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!formState || !validateForm(formState)) return;

    const normalizedPrice = currencyInputToApiValue(formState.price);
    if (!normalizedPrice || !formState.campaignId) return;

    const billingOptions = formState.billingOptions.map((option) => ({
      ...option,
      cycle: option.type === "one_time" ? "none" : option.cycle,
      allowed_installments:
        option.billing_method === "credit_card" ? option.allowed_installments : [],
      code: codeFromBillingOption({
        type: option.type,
        billingMethod: option.billing_method,
        cycle: option.type === "one_time" ? "none" : option.cycle,
      }),
    }));

    try {
      await updateOffer.mutateAsync({
        name: formState.name.trim(),
        student_classes: formState.studentClassIds,
        price: normalizedPrice,
        payment_mode: derivePaymentMode(billingOptions),
        plan_type: planTypeFromBillingOptions(billingOptions),
        allow_cash_discount: formState.allowCashDiscount,
        cash_discount_type: formState.allowCashDiscount ? formState.cashDiscountType || null : null,
        cash_discount_value: formState.allowCashDiscount ? formState.cashDiscountValue : null,
        campaign: Number(formState.campaignId),
        billing_options: billingOptions,
      });
      setIsEditing(false);
    } catch {
      // The mutation state renders the error message below.
    }
  }

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

  if (isEditing && formState) {
    return (
      <OfferEditView
        data={data}
        formState={formState}
        setFormState={setFormState}
        errors={errors}
        setErrors={setErrors}
        campaigns={campaignOptions}
        isLoadingCampaigns={isLoadingCampaigns}
        studentClasses={studentClassOptions}
        isLoadingStudentClasses={isLoadingStudentClasses}
        isSaving={updateOffer.isPending}
        hasSaveError={updateOffer.isError}
        onCancel={cancelEditing}
        onSave={handleSave}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BackLink />
        <Button type="button" className="h-11 rounded-2xl" onClick={startEditing}>
          <Edit3 className="h-4 w-4" />
          Editar
        </Button>
      </div>

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
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
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
                      {studentClass.is_generic && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
                          Genérica
                        </span>
                      )}
                    </div>
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

function OfferEditView({
  data,
  formState,
  setFormState,
  errors,
  setErrors,
  campaigns,
  isLoadingCampaigns,
  studentClasses,
  isLoadingStudentClasses,
  isSaving,
  hasSaveError,
  onCancel,
  onSave,
}: {
  data: OfferDetail;
  formState: OfferEditFormState;
  setFormState: Dispatch<SetStateAction<OfferEditFormState | null>>;
  errors: OfferEditErrors;
  setErrors: Dispatch<SetStateAction<OfferEditErrors>>;
  campaigns: { id: number; name: string }[];
  isLoadingCampaigns: boolean;
  studentClasses: { id: number; name: string; is_generic?: boolean }[];
  isLoadingStudentClasses: boolean;
  isSaving: boolean;
  hasSaveError: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [editingBillingIndex, setEditingBillingIndex] = useState<number | null>(null);
  const [billingDraft, setBillingDraft] = useState<BillingDraft>(DEFAULT_BILLING_DRAFT);

  const selectedClassLabel = useMemo(() => {
    if (formState.studentClassIds.length === 0) return "Selecionar turmas";
    const labels = studentClasses
      .filter((item) => formState.studentClassIds.includes(item.id))
      .map((item) => item.name);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.length} turmas selecionadas`;
  }, [formState.studentClassIds, studentClasses]);

  function updateForm(patch: Partial<OfferEditFormState>) {
    setFormState((current) => (current ? { ...current, ...patch } : current));
  }

  function openBillingModal(option?: BillingOptionPayload, index?: number) {
    if (option) {
      setBillingDraft({
        type: option.type,
        billingMethod: option.billing_method,
        cycle: option.cycle === "none" ? "monthly" : option.cycle,
        price: apiValueToCurrencyInput(option.price),
        maxInstallments:
          option.allowed_installments.length > 0 ? Math.max(...option.allowed_installments) : "",
        isActive: option.is_active,
      });
      setEditingBillingIndex(index ?? null);
    } else {
      setBillingDraft(DEFAULT_BILLING_DRAFT);
      setEditingBillingIndex(null);
    }
    setIsBillingModalOpen(true);
  }

  function closeBillingModal() {
    setIsBillingModalOpen(false);
    setEditingBillingIndex(null);
    setBillingDraft(DEFAULT_BILLING_DRAFT);
  }

  function saveBillingOption() {
    const normalizedPrice = currencyInputToApiValue(billingDraft.price);
    const needsInstallments = billingDraft.billingMethod === "credit_card";
    if (!normalizedPrice) return;
    if (needsInstallments && !billingDraft.maxInstallments) return;

    const cycle = billingDraft.type === "one_time" ? "none" : billingDraft.cycle;
    const billingOption: BillingOptionPayload = {
      code: codeFromBillingOption({
        type: billingDraft.type,
        billingMethod: billingDraft.billingMethod,
        cycle,
      }),
      type: billingDraft.type,
      cycle,
      billing_method: billingDraft.billingMethod,
      price: normalizedPrice,
      allowed_installments:
        needsInstallments && billingDraft.maxInstallments
          ? buildInstallmentRange(Number(billingDraft.maxInstallments))
          : [],
      is_active: billingDraft.isActive,
    };

    setFormState((current) => {
      if (!current) return current;
      const nextOptions =
        editingBillingIndex === null
          ? [...current.billingOptions, billingOption]
          : current.billingOptions.map((option, index) =>
              index === editingBillingIndex ? billingOption : option
            );
      return { ...current, billingOptions: nextOptions };
    });
    setErrors((current) => ({ ...current, billingOptions: undefined }));
    closeBillingModal();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BackLink />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button type="button" className="h-11 rounded-2xl" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_24%)]" />
        <div className="relative px-6 py-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
            <Edit3 className="h-3.5 w-3.5" />
            Editando oferta #{data.id}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {formState.name || data.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Atualize os dados comerciais, campanha, turmas e opcoes de cobranca desta oferta.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.85fr)]">
        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <SectionHeader icon={BadgeDollarSign} eyebrow="Dados" title="Informacoes comerciais" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <Input
                value={formState.name}
                onChange={(event) => {
                  updateForm({ name: event.target.value });
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                className="h-11 rounded-2xl"
              />
              {errors.name && <FieldError message={errors.name} />}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preco base</label>
                <Input
                  value={formState.price}
                  onChange={(event) => {
                    updateForm({ price: formatCurrencyInput(event.target.value) });
                    setErrors((current) => ({ ...current, price: undefined }));
                  }}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  className="h-11 rounded-2xl"
                />
                {errors.price && <FieldError message={errors.price} />}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Campanha</label>
                <SingleSelectDropdown
                  value={formState.campaignId}
                  options={campaigns.map((campaign) => ({
                    value: campaign.id,
                    label: campaign.name,
                  }))}
                  placeholder="Selecionar campanha"
                  ariaLabel="Selecionar campanha"
                  isLoading={isLoadingCampaigns}
                  onChange={(value) => {
                    updateForm({ campaignId: value });
                    setErrors((current) => ({ ...current, campaignId: undefined }));
                  }}
                />
                {errors.campaignId && <FieldError message={errors.campaignId} />}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Turmas</label>
              <MultiSelectDropdown
                label={selectedClassLabel}
                options={studentClasses.map((studentClass) => ({
                  value: studentClass.id,
                  label: studentClass.name,
                  isGeneric: studentClass.is_generic,
                }))}
                selectedValues={formState.studentClassIds}
                onToggle={(id) => {
                  updateForm({
                    studentClassIds: formState.studentClassIds.includes(id)
                      ? formState.studentClassIds.filter((item) => item !== id)
                      : [...formState.studentClassIds, id],
                  });
                  setErrors((current) => ({ ...current, studentClassIds: undefined }));
                }}
                isLoading={isLoadingStudentClasses}
                emptyLabel="Nenhuma turma encontrada."
                ariaLabel="Selecionar turmas"
              />
              {errors.studentClassIds && <FieldError message={errors.studentClassIds} />}
            </div>

            <div className="rounded-[1.5rem] border border-border bg-background p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={formState.allowCashDiscount}
                  onChange={(event) => {
                    updateForm({
                      allowCashDiscount: event.target.checked,
                      cashDiscountType: event.target.checked ? formState.cashDiscountType : "",
                      cashDiscountValue: event.target.checked ? formState.cashDiscountValue : "",
                    });
                    setErrors((current) => ({
                      ...current,
                      cashDiscountType: undefined,
                      cashDiscountValue: undefined,
                    }));
                  }}
                />
                Permitir desconto a vista
              </label>

              {formState.allowCashDiscount && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo de desconto</label>
                    <SingleSelectDropdown
                      value={formState.cashDiscountType}
                      options={[
                        { value: "fixed" as const, label: "Fixo" },
                        { value: "percent" as const, label: "Percentual" },
                      ]}
                      placeholder="Selecionar tipo"
                      ariaLabel="Selecionar tipo de desconto"
                      onChange={(value) => {
                        updateForm({ cashDiscountType: value });
                        setErrors((current) => ({ ...current, cashDiscountType: undefined }));
                      }}
                    />
                    {errors.cashDiscountType && <FieldError message={errors.cashDiscountType} />}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Valor</label>
                    <Input
                      value={formState.cashDiscountValue}
                      onChange={(event) => {
                        updateForm({ cashDiscountValue: normalizeDecimalInput(event.target.value) });
                        setErrors((current) => ({ ...current, cashDiscountValue: undefined }));
                      }}
                      inputMode="decimal"
                      placeholder="10.00"
                      className="h-11 rounded-2xl"
                    />
                    {errors.cashDiscountValue && <FieldError message={errors.cashDiscountValue} />}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader icon={CreditCard} eyebrow="Cobranca" title="Opcoes de pagamento" />
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => openBillingModal()}
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            {formState.billingOptions.length === 0 ? (
              <EmptyText>Nenhuma opcao de pagamento configurada.</EmptyText>
            ) : (
              <div className="grid gap-3">
                {formState.billingOptions.map((option, index) => (
                  <EditableBillingOptionCard
                    key={`${option.code}-${index}`}
                    option={option}
                    onEdit={() => openBillingModal(option, index)}
                    onRemove={() => {
                      updateForm({
                        billingOptions: formState.billingOptions.filter((_, itemIndex) => itemIndex !== index),
                      });
                    }}
                  />
                ))}
              </div>
            )}
            {errors.billingOptions && <FieldError message={errors.billingOptions} />}
          </CardContent>
        </Card>
      </div>

      {hasSaveError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao atualizar oferta. Revise os dados e tente novamente.
        </div>
      )}

      {isBillingModalOpen && (
        <BillingOptionModal
          draft={billingDraft}
          setDraft={setBillingDraft}
          onClose={closeBillingModal}
          onSave={saveBillingOption}
          isEditing={editingBillingIndex !== null}
        />
      )}
    </section>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
}

function EditableBillingOptionCard({
  option,
  onEdit,
  onRemove,
}: {
  option: BillingOptionPayload;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const Icon = option.billing_method === "pix" ? QrCode : CreditCard;

  return (
    <article className="rounded-[1.5rem] border border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-700">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {billingOptionCodeLabel(option.code)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {billingTypeLabel(option.type)} - {cycleLabel(option.cycle)} -{" "}
              {billingMethodLabel(option.billing_method)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-2xl" onClick={onEdit}>
            Editar
          </Button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Remover ${billingOptionCodeLabel(option.code)}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <DetailLine label="Preco" value={formatCurrency(option.price)} />
        <DetailLine label="Status" value={option.is_active ? "Ativa" : "Inativa"} />
        <DetailLine
          label="Parcelas"
          value={
            option.allowed_installments.length > 0
              ? option.allowed_installments.join(", ")
              : "Nao se aplica"
          }
        />
      </div>
    </article>
  );
}

function BillingOptionModal({
  draft,
  setDraft,
  onClose,
  onSave,
  isEditing,
}: {
  draft: BillingDraft;
  setDraft: Dispatch<SetStateAction<BillingDraft>>;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  const requiresInstallments = draft.billingMethod === "credit_card";
  const normalizedPrice = currencyInputToApiValue(draft.price);
  const canSave = Boolean(normalizedPrice) && (!requiresInstallments || Boolean(draft.maxInstallments));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-option-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billing option</p>
              <h2 id="billing-option-title" className="text-xl font-semibold text-foreground">
                {isEditing ? "Editar opcao de cobranca" : "Adicionar opcao de cobranca"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <SingleSelectDropdown
                value={draft.type}
                options={[
                  { value: "recurring" as const, label: "Recorrente" },
                  { value: "one_time" as const, label: "Pagamento unico" },
                ]}
                placeholder="Selecionar tipo"
                ariaLabel="Selecionar tipo"
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    type: value || "recurring",
                    cycle: value === "one_time" ? "monthly" : current.cycle,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Metodo</label>
              <SingleSelectDropdown
                value={draft.billingMethod}
                options={[
                  { value: "pix" as const, label: "Pix" },
                  { value: "credit_card" as const, label: "Cartao de credito" },
                ]}
                placeholder="Selecionar metodo"
                ariaLabel="Selecionar metodo"
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    billingMethod: value || "pix",
                    maxInstallments: value === "credit_card" ? current.maxInstallments : "",
                  }))
                }
              />
            </div>
          </div>

          {draft.type === "recurring" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ciclo</label>
              <SingleSelectDropdown
                value={draft.cycle}
                options={CYCLE_OPTIONS}
                placeholder="Selecionar ciclo"
                ariaLabel="Selecionar ciclo"
                onChange={(value) =>
                  setDraft((current) => ({ ...current, cycle: value || "monthly" }))
                }
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preco</label>
              <Input
                value={draft.price}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    price: formatCurrencyInput(event.target.value),
                  }))
                }
                inputMode="numeric"
                placeholder="R$ 0,00"
                className="h-11 rounded-2xl"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Ativa
            </label>
          </div>

          {requiresInstallments && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Total de parcelas</label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((installment) => (
                  <button
                    key={installment}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, maxInstallments: installment }))
                    }
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
                      draft.maxInstallments === installment
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {installment}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" className="h-11 rounded-2xl" onClick={onSave} disabled={!canSave}>
            {isEditing ? "Salvar opcao" : "Adicionar opcao"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SingleSelectDropdown<T extends string | number>({
  value,
  options,
  placeholder,
  onChange,
  ariaLabel,
  isLoading,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  placeholder: string;
  onChange: (value: T | "") => void;
  ariaLabel: string;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (!dropdownRef.current || !event.target) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 z-30 w-full rounded-2xl border border-border bg-card p-2 shadow-lg">
          {isLoading && <p className="px-3 py-2 text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma opcao encontrada.</p>
          )}
          {!isLoading && options.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-auto pr-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onToggle,
  isLoading,
  emptyLabel,
  ariaLabel,
}: {
  label: string;
  options: { value: number; label: string; isGeneric?: boolean }[];
  selectedValues: number[];
  onToggle: (value: number) => void;
  isLoading?: boolean;
  emptyLabel: string;
  ariaLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (!dropdownRef.current || !event.target) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className={cn("truncate", selectedValues.length === 0 && "text-muted-foreground")}>
          {label}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 z-30 w-full rounded-2xl border border-border bg-card p-3 shadow-lg">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && options.length === 0 && (
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          )}
          {!isLoading && options.length > 0 && (
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => onToggle(option.value)}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.isGeneric && (
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                      Genérica
                    </span>
                  )}
                  {selectedValues.includes(option.value) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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
