"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, CreditCard, Layers3, Plus, QrCode, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCreateOffer,
  useOfferCoursesSimple,
  useOfferStudentClassesSimple,
} from "@/features/offers/queries/offersQueries";
import type { BillingOptionPayload, OfferPlanType, PaymentMode } from "@/features/offers/types/offer";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const BILLING_OPTION_META = {
  UPFRONT_PIX: {
    label: "Pix unico",
    subtitle: "Pagamento avulso via Pix",
    type: "one_time" as const,
    cycle: "none" as const,
    billing_method: "pix" as const,
    mode: "one_time" as const,
    icon: QrCode,
  },
  UPFRONT_CREDIT_CARD: {
    label: "Cartao de credito unico",
    subtitle: "Pagamento avulso no cartao",
    type: "one_time" as const,
    cycle: "none" as const,
    billing_method: "credit_card" as const,
    mode: "one_time" as const,
    icon: CreditCard,
  },
  MONTHLY_PIX: {
    label: "Pix mensal automatico",
    subtitle: "Cobranca recorrente mensal em Pix",
    type: "recurring" as const,
    cycle: "monthly" as const,
    billing_method: "pix" as const,
    mode: "monthly" as const,
    icon: QrCode,
  },
  MONTHLY_CREDIT_CARD: {
    label: "Cartao de credito mensal",
    subtitle: "Cobranca recorrente mensal no cartao",
    type: "recurring" as const,
    cycle: "monthly" as const,
    billing_method: "credit_card" as const,
    mode: "monthly" as const,
    icon: CreditCard,
  },
} satisfies Record<
  CreateBillingOptionCode,
  {
    label: string;
    subtitle: string;
    type: "one_time" | "recurring";
    cycle: "none" | "monthly";
    billing_method: "pix" | "credit_card";
    mode: PaymentMode;
    icon: typeof QrCode;
  }
>;

const PLAN_TYPE_OPTIONS: Array<{
  value: OfferPlanType;
  label: string;
  durationLabel: string;
  accessDurationDays: string;
}> = [
  { value: "monthly", label: "Mensal", durationLabel: "1 mes", accessDurationDays: "30" },
  { value: "quarterly", label: "Trimestral", durationLabel: "3 meses", accessDurationDays: "90" },
  { value: "semi_annual", label: "Semestral", durationLabel: "6 meses", accessDurationDays: "180" },
  { value: "annual", label: "Anual", durationLabel: "12 meses", accessDurationDays: "365" },
];

type CreateBillingOptionCode =
  | "UPFRONT_PIX"
  | "UPFRONT_CREDIT_CARD"
  | "MONTHLY_PIX"
  | "MONTHLY_CREDIT_CARD";

type OfferFormState = {
  name: string;
  price: string;
  accessDurationDays: string;
  planType: OfferPlanType | "";
  gracePeriodDays: string;
  courseId: number | "";
  studentClassIds: number[];
  paymentModes: PaymentMode[];
  billingOptions: BillingOptionPayload[];
};

type OfferFormErrors = Partial<
  Record<
    | "name"
    | "price"
    | "accessDurationDays"
    | "planType"
    | "gracePeriodDays"
    | "courseId"
    | "studentClassIds"
    | "paymentModes"
    | "billingOptions",
    string
  >
>;

const DEFAULT_FORM: OfferFormState = {
  name: "",
  price: "",
  accessDurationDays: "",
  planType: "",
  gracePeriodDays: "",
  courseId: "",
  studentClassIds: [],
  paymentModes: [],
  billingOptions: [],
};

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return currencyFormatter.format(amount);
}

function currencyInputToApiValue(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}

function formatCurrency(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return currencyFormatter.format(parsed);
}

function normalizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function getCompatibleBillingOptionCodes(paymentModes: PaymentMode[]) {
  return (Object.keys(BILLING_OPTION_META) as CreateBillingOptionCode[]).filter((code) =>
    paymentModes.includes(BILLING_OPTION_META[code].mode)
  );
}

function buildBillingOptionPayload(params: {
  code: CreateBillingOptionCode;
  price: string;
  installments: number[];
}) {
  const meta = BILLING_OPTION_META[params.code];
  return {
    code: params.code,
    type: meta.type,
    cycle: meta.cycle,
    billing_method: meta.billing_method,
    price: params.price,
    allowed_installments: params.installments,
    is_active: true,
  } satisfies BillingOptionPayload;
}

function buildInstallmentRange(limit: number) {
  return Array.from({ length: limit }, (_, index) => index + 1);
}

function planTypeLabel(value: OfferPlanType | "") {
  return PLAN_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "-";
}

export function CreateOfferPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [formState, setFormState] = useState<OfferFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<OfferFormErrors>({});
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingCode, setBillingCode] = useState<CreateBillingOptionCode | "">("");
  const [billingPrice, setBillingPrice] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);

  const { data: courses, isLoading: isLoadingCourses } = useOfferCoursesSimple();
  const { data: studentClasses, isLoading: isLoadingStudentClasses } = useOfferStudentClassesSimple(
    formState.courseId ? { course: formState.courseId } : undefined
  );
  const createOffer = useCreateOffer();

  const courseOptions = useMemo(() => courses ?? [], [courses]);
  const studentClassOptions = useMemo(() => studentClasses ?? [], [studentClasses]);
  const selectedCourse = courseOptions.find((item) => item.id === formState.courseId) ?? null;
  const selectedClassLabels = useMemo(() => {
    if (formState.studentClassIds.length === 0) return "Selecionar turmas";
    const labels = studentClassOptions
      .filter((item) => formState.studentClassIds.includes(item.id))
      .map((item) => item.name);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.length} turmas selecionadas`;
  }, [formState.studentClassIds, studentClassOptions]);
  const compatibleCodes = useMemo(
    () => getCompatibleBillingOptionCodes(formState.paymentModes),
    [formState.paymentModes]
  );

  function togglePaymentMode(mode: PaymentMode) {
    setFormState((current) => {
      const nextPaymentModes = current.paymentModes.includes(mode)
        ? current.paymentModes.filter((item) => item !== mode)
        : [...current.paymentModes, mode];
      const nextCompatibleCodes = getCompatibleBillingOptionCodes(nextPaymentModes);

      return {
        ...current,
        paymentModes: nextPaymentModes,
        billingOptions: current.billingOptions.filter((option) =>
          nextCompatibleCodes.includes(option.code as CreateBillingOptionCode)
        ),
      };
    });
    setErrors((current) => ({ ...current, paymentModes: undefined, billingOptions: undefined }));
  }

  function openBillingModal() {
    setBillingCode(compatibleCodes[0] ?? "");
    setBillingPrice(formState.price);
    setSelectedInstallments([]);
    setIsBillingModalOpen(true);
  }

  function closeBillingModal() {
    setIsBillingModalOpen(false);
    setBillingCode("");
    setBillingPrice("");
    setSelectedInstallments([]);
  }

  function handleToggleStudentClass(id: number) {
    setFormState((current) => ({
      ...current,
      studentClassIds: current.studentClassIds.includes(id)
        ? current.studentClassIds.filter((item) => item !== id)
        : [...current.studentClassIds, id],
    }));
    setErrors((current) => ({ ...current, studentClassIds: undefined }));
  }

  function validateStepOne() {
    const nextErrors: OfferFormErrors = {};
    const normalizedPrice = currencyInputToApiValue(formState.price);

    if (!formState.name.trim()) {
      nextErrors.name = "Informe o nome da oferta.";
    }

    if (!normalizedPrice || Number(normalizedPrice) <= 0) {
      nextErrors.price = "Informe um preco maior que zero.";
    }

    if (!formState.accessDurationDays || Number(formState.accessDurationDays) <= 0) {
      nextErrors.accessDurationDays = "Informe os dias de duracao.";
    }

    if (!formState.planType) {
      nextErrors.planType = "Selecione o tipo de plano.";
    }

    if (!formState.gracePeriodDays) {
      nextErrors.gracePeriodDays = "Informe o periodo de acesso pos vencimento.";
    }

    if (!formState.courseId) {
      nextErrors.courseId = "Selecione um curso.";
    }

    if (formState.studentClassIds.length === 0) {
      nextErrors.studentClassIds = "Selecione ao menos uma turma.";
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateFullForm() {
    const nextErrors: OfferFormErrors = {};
    const normalizedPrice = currencyInputToApiValue(formState.price);

    if (!formState.name.trim()) {
      nextErrors.name = "Informe o nome da oferta.";
    }
    if (!normalizedPrice || Number(normalizedPrice) <= 0) {
      nextErrors.price = "Informe um preco maior que zero.";
    }
    if (!formState.accessDurationDays || Number(formState.accessDurationDays) <= 0) {
      nextErrors.accessDurationDays = "Informe os dias de duracao.";
    }
    if (!formState.planType) {
      nextErrors.planType = "Selecione o tipo de plano.";
    }
    if (!formState.gracePeriodDays) {
      nextErrors.gracePeriodDays = "Informe o periodo de acesso pos vencimento.";
    }
    if (!formState.courseId) {
      nextErrors.courseId = "Selecione um curso.";
    }
    if (formState.studentClassIds.length === 0) {
      nextErrors.studentClassIds = "Selecione ao menos uma turma.";
    }
    if (formState.paymentModes.length === 0) {
      nextErrors.paymentModes = "Selecione ao menos um modo de pagamento.";
    }
    if (formState.billingOptions.length === 0) {
      nextErrors.billingOptions = "Adicione pelo menos uma opcao de cobranca.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNextStep() {
    if (!validateStepOne()) return;
    setStep(2);
  }

  function handleBackStep() {
    setStep(1);
  }

  function handleAddBillingOption() {
    if (!billingCode) return;

    const normalizedPrice = currencyInputToApiValue(billingPrice);
    const requiresInstallments =
      BILLING_OPTION_META[billingCode].billing_method === "credit_card";

    if (!normalizedPrice || Number(normalizedPrice) <= 0) {
      return;
    }

    if (requiresInstallments && selectedInstallments.length === 0) {
      return;
    }

    const payload = buildBillingOptionPayload({
      code: billingCode,
      price: normalizedPrice,
      installments: requiresInstallments ? [...selectedInstallments].sort((a, b) => a - b) : [],
    });

    setFormState((current) => ({
      ...current,
      billingOptions: [
        ...current.billingOptions.filter((option) => option.code !== billingCode),
        payload,
      ],
    }));
    setErrors((current) => ({ ...current, billingOptions: undefined }));
    closeBillingModal();
  }

  function handleInstallmentSelect(installment: number) {
    setSelectedInstallments((current) => {
      const highestSelected = current.length > 0 ? Math.max(...current) : 0;

      if (highestSelected === installment) {
        return installment > 1 ? buildInstallmentRange(installment - 1) : [];
      }

      return buildInstallmentRange(installment);
    });
  }

  async function handleCreateOffer() {
    if (!validateFullForm()) return;

    const normalizedPrice = currencyInputToApiValue(formState.price);
    if (!normalizedPrice || !formState.courseId || !formState.planType) return;

    const hasRecurringBillingOption = formState.billingOptions.some(
      (option) => option.type === "recurring"
    );

    try {
      await createOffer.mutateAsync({
        name: formState.name.trim(),
        student_classes: formState.studentClassIds,
        courses: [Number(formState.courseId)],
        access_duration_days: Number(formState.accessDurationDays),
        grace_period_days: Number(formState.gracePeriodDays),
        price: normalizedPrice,
        is_active: true,
        payment_mode: formState.paymentModes,
        allow_cash_discount: false,
        plan_type: hasRecurringBillingOption ? formState.planType : null,
        billing_options: formState.billingOptions,
      });
      router.push("/offers");
    } catch {
      // handled by mutation state
    }
  }

  const activeBillingMeta = billingCode ? BILLING_OPTION_META[billingCode] : null;
  const shouldShowInstallments =
    activeBillingMeta?.billing_method === "credit_card";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/offers"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para ofertas
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.12),transparent_24%)]" />
          <div className="relative flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
                <Layers3 className="h-3.5 w-3.5" />
                Nova oferta
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Criar oferta
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Estruture os dados comerciais na primeira etapa e monte as opcoes de cobranca na
                  segunda.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <StepBadge number={1} label="Dados base" active={step === 1} complete={step === 2} />
              <StepBadge number={2} label="Pagamento" active={step === 2} complete={false} />
            </div>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Etapa 1
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Configuracao principal</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input
                  value={formState.name}
                  onChange={(event) => {
                    setFormState((current) => ({ ...current, name: event.target.value }));
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Plano Ingles 12 meses"
                  className="h-11 rounded-2xl"
                />
                {errors.name && <FieldError message={errors.name} />}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preco</label>
                  <Input
                    value={formState.price}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        price: formatCurrencyInput(event.target.value),
                      }));
                      setErrors((current) => ({ ...current, price: undefined }));
                    }}
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    className="h-11 rounded-2xl"
                  />
                  {errors.price && <FieldError message={errors.price} />}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Dias de duracao</label>
                  <Input
                    value={formState.accessDurationDays}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        accessDurationDays: normalizeIntegerInput(event.target.value),
                      }));
                      setErrors((current) => ({ ...current, accessDurationDays: undefined }));
                    }}
                    inputMode="numeric"
                    placeholder="365"
                    className="h-11 rounded-2xl"
                  />
                  {errors.accessDurationDays && <FieldError message={errors.accessDurationDays} />}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Tipo de plano</label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {PLAN_TYPE_OPTIONS.map((option) => {
                    const isSelected = formState.planType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFormState((current) => ({
                            ...current,
                            planType: option.value,
                            accessDurationDays: option.accessDurationDays,
                          }));
                          setErrors((current) => ({
                            ...current,
                            planType: undefined,
                            accessDurationDays: undefined,
                          }));
                        }}
                        className={cn(
                          "rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
                          isSelected
                            ? "border-primary/30 bg-primary/10"
                            : "border-border bg-background hover:bg-accent/50"
                        )}
                      >
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{option.durationLabel}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.planType && <FieldError message={errors.planType} />}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Acesso pos vencimento
                  </label>
                  <Input
                    value={formState.gracePeriodDays}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        gracePeriodDays: normalizeIntegerInput(event.target.value),
                      }));
                      setErrors((current) => ({ ...current, gracePeriodDays: undefined }));
                    }}
                    inputMode="numeric"
                    placeholder="3"
                    className="h-11 rounded-2xl"
                  />
                  {errors.gracePeriodDays && <FieldError message={errors.gracePeriodDays} />}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Curso</label>
                  <SingleSelectDropdown
                    value={formState.courseId}
                    options={courseOptions.map((item) => ({ value: item.id, label: item.name }))}
                    placeholder="Selecionar curso"
                    ariaLabel="Selecionar curso"
                    isLoading={isLoadingCourses}
                    onChange={(value) => {
                      setFormState((current) => ({
                        ...current,
                        courseId: value,
                        studentClassIds: [],
                      }));
                      setErrors((current) => ({
                        ...current,
                        courseId: undefined,
                        studentClassIds: undefined,
                      }));
                    }}
                  />
                  {errors.courseId && <FieldError message={errors.courseId} />}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Turmas</label>
                <MultiSelectDropdown
                  label={selectedClassLabels}
                  isLoading={isLoadingStudentClasses}
                  options={studentClassOptions.map((item) => ({
                    value: item.id,
                    label: item.name,
                    isGeneric: item.is_generic,
                  }))}
                  selectedValues={formState.studentClassIds}
                  onToggle={handleToggleStudentClass}
                  emptyLabel="Nenhuma turma encontrada."
                  ariaLabel="Selecionar turmas"
                />
                {errors.studentClassIds && <FieldError message={errors.studentClassIds} />}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Resumo atual
            </p>
            <div className="mt-4 space-y-3">
              <SummaryLine label="Nome" value={formState.name || "-"} />
              <SummaryLine label="Preco base" value={formState.price || "-"} />
              <SummaryLine label="Tipo de plano" value={planTypeLabel(formState.planType)} />
              <SummaryLine
                label="Duracao"
                value={formState.accessDurationDays ? `${formState.accessDurationDays} dias` : "-"}
              />
              <SummaryLine
                label="Pos vencimento"
                value={formState.gracePeriodDays ? `${formState.gracePeriodDays} dias` : "-"}
              />
              <SummaryLine label="Curso" value={selectedCourse?.name ?? "-"} />
              <SummaryLine
                label="Turmas"
                value={
                  formState.studentClassIds.length > 0
                    ? `${formState.studentClassIds.length} selecionada(s)`
                    : "-"
                }
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Etapa 2
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Pagamento e cobranca</h2>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Selecao de pagamento</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => togglePaymentMode("monthly")}
                    className={cn(
                      "rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
                      formState.paymentModes.includes("monthly")
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-background hover:bg-accent/50"
                    )}
                  >
                    <p className="font-semibold text-foreground">Mensal</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ativa cobrancas recorrentes.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePaymentMode("one_time")}
                    className={cn(
                      "rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
                      formState.paymentModes.includes("one_time")
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-background hover:bg-accent/50"
                    )}
                  >
                    <p className="font-semibold text-foreground">Pagamento unico</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ativa cobrancas avulsas.
                    </p>
                  </button>
                </div>
                {errors.paymentModes && <FieldError message={errors.paymentModes} />}
              </div>

              <div className="rounded-[1.6rem] border border-border bg-background/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Opcoes de pagamento</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl"
                    onClick={openBillingModal}
                    disabled={compatibleCodes.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar opcao
                  </Button>
                </div>

                {compatibleCodes.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Selecione pelo menos um modo de pagamento para liberar as opcoes.
                  </p>
                )}

                {formState.billingOptions.length === 0 && compatibleCodes.length > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nenhuma opcao de cobranca adicionada ainda.
                  </p>
                )}

                {formState.billingOptions.length > 0 && (
                  <div className="mt-4 grid gap-3">
                    {formState.billingOptions.map((option) => {
                      const meta = BILLING_OPTION_META[option.code as CreateBillingOptionCode];
                      const Icon = meta.icon;
                      return (
                        <article
                          key={option.code}
                          className="rounded-[1.4rem] border border-border bg-card px-4 py-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="font-semibold text-foreground">{meta.label}</p>
                                <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFormState((current) => ({
                                  ...current,
                                  billingOptions: current.billingOptions.filter(
                                    (item) => item.code !== option.code
                                  ),
                                }))
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              aria-label={`Remover ${meta.label}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <SummaryLine label="Preco" value={formatCurrency(option.price)} compact />
                            <SummaryLine
                              label="Metodo"
                              value={option.billing_method === "pix" ? "Pix" : "Cartao"}
                              compact
                            />
                            <SummaryLine
                              label="Parcelas"
                              value={
                                option.allowed_installments.length > 0
                                  ? option.allowed_installments.join(", ")
                                  : "Nao se aplica"
                              }
                              compact
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
                {errors.billingOptions && <FieldError message={errors.billingOptions} />}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Payload previsto
            </p>
            <div className="mt-4 space-y-3">
              <SummaryLine label="Nome" value={formState.name || "-"} />
              <SummaryLine label="Preco base" value={formState.price || "-"} />
              <SummaryLine
                label="Payment mode"
                value={formState.paymentModes.length ? formState.paymentModes.join(", ") : "-"}
              />
              <SummaryLine label="Plan type" value={formState.planType || "-"} />
              <SummaryLine
                label="Billing options"
                value={String(formState.billingOptions.length)}
              />
            </div>
          </div>
        </div>
      )}

      {createOffer.isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao criar oferta. Revise os dados e tente novamente.
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 rounded-[2rem] border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {step === 1
            ? "Preencha os dados base antes de avancar."
            : "Configure modos de pagamento e monte as billing options."}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {step === 2 && (
            <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={handleBackStep}>
              Voltar etapa
            </Button>
          )}
          {step === 1 ? (
            <Button type="button" className="h-11 rounded-2xl" onClick={handleNextStep}>
              Ir para pagamento
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 rounded-2xl"
              onClick={handleCreateOffer}
              disabled={createOffer.isPending}
            >
              {createOffer.isPending ? "Criando..." : "Criar oferta"}
            </Button>
          )}
        </div>
      </div>

      {isBillingModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="billing-option-title"
          onClick={closeBillingModal}
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
                    Adicionar opcao de cobranca
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeBillingModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <SingleSelectDropdown
                  value={billingCode}
                  options={compatibleCodes.map((code) => ({
                    value: code,
                    label: BILLING_OPTION_META[code].label,
                  }))}
                  placeholder="Selecionar tipo"
                  ariaLabel="Selecionar tipo de cobranca"
                  onChange={(value) => {
                    setBillingCode(value);
                    setSelectedInstallments([]);
                  }}
                />
              </div>

              {activeBillingMeta && (
                <div className="rounded-[1.4rem] border border-border bg-background px-4 py-4">
                  <p className="font-semibold text-foreground">{activeBillingMeta.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeBillingMeta.subtitle}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preco</label>
                <Input
                  value={billingPrice}
                  onChange={(event) => setBillingPrice(formatCurrencyInput(event.target.value))}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  className="h-11 rounded-2xl"
                />
              </div>

              {shouldShowInstallments && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Parcelas permitidas</label>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((installment) => {
                      const isSelected = selectedInstallments.includes(installment);
                      return (
                        <button
                          key={installment}
                          type="button"
                          onClick={() => handleInstallmentSelect(installment)}
                          className={cn(
                            "rounded-2xl border px-3 py-2 text-sm font-medium transition-colors",
                            isSelected
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-background text-foreground hover:bg-accent"
                          )}
                        >
                          {installment}x
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Para credito mensal, selecione a faixa de 1 a 12 conforme sua regra comercial.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={closeBillingModal}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-11 rounded-2xl"
                onClick={handleAddBillingOption}
                disabled={
                  !billingCode ||
                  !currencyInputToApiValue(billingPrice) ||
                  (shouldShowInstallments && selectedInstallments.length === 0)
                }
              >
                Salvar opcao
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StepBadge({
  number,
  label,
  active,
  complete,
}: {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border px-4 py-3",
        active ? "border-primary/30 bg-primary/10" : "border-border bg-background/80"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold",
            complete || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {complete ? <Check className="h-4 w-4" /> : number}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Etapa {number}</p>
          <p className="text-sm font-semibold text-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background", compact ? "px-3 py-3" : "px-4 py-3")}>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-sm text-destructive">{message}</p>;
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
    function handleClickOutside(event: MouseEvent) {
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
    function handleClickOutside(event: MouseEvent) {
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
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
