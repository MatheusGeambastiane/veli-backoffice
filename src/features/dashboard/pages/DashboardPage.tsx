"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, BookOpen, Check, CircleDollarSign, Copy, GraduationCap, Users, Video } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardSummary } from "@/features/dashboard/queries/dashboardQueries";
import { useSessionUser } from "@/shared/auth/useSessionUser";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { DashboardClass, OrdersLast3Months } from "@/features/dashboard/types/dashboardTypes";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
const weekDayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});
const dashboardGreetings = [
  "Ola, {user}",
  "Salut, {user}, ravi de te voir",
  "Hello, {user}, welcome back.",
  "Salut, {user}, bienvenue dans ton espace.",
  "Hi, {user}, let's do this.",
  "Bem-vindo, {user}",
] as const;

const lessonTypeLabel = {
  live: "Ao vivo",
  asynchronous: "Assincrona",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateTimeFormatter.format(date);
}

function formatWeekday(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return weekDayFormatter.format(date);
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return currencyFormatter.format(value);
}

function formatShortMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function buildWeekDays(referenceDate: Date) {
  const dayOfWeek = referenceDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(referenceDate);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(referenceDate.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });
}

function getDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getClassLabel(item: DashboardClass) {
  const lessonName = item.lesson?.name ?? "Aula";
  const courseName = item.student_class?.course_name ?? "Turma";
  return `${lessonName} · ${courseName}`;
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary();
  const { user } = useSessionUser();
  const displayName = useMemo(() => {
    const rawName = user?.name?.trim() || "Usuario";
    return rawName.split(" ")[0] || rawName;
  }, [user?.name]);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [typedGreeting, setTypedGreeting] = useState("");
  const [hasCopiedNextClassLink, setHasCopiedNextClassLink] = useState(false);
  const isManager = user?.role?.toLowerCase() === "manager";

  const totalStudentsByClass = useMemo(() => {
    return data?.students_by_active_class?.reduce((total, item) => total + item.students_count, 0) ?? 0;
  }, [data]);

  const nextClass = data?.next_class ?? null;
  const nextClassroomLink =
    nextClass?.student_class?.classroom_link || nextClass?.classroom_link || null;
  const weekCalendar = data?.week_calendar ?? [];
  const activeClasses = data?.students_by_active_class ?? [];
  const offerBilling = data?.billed_amount_by_offer ?? [];
  const campaignBilling = data?.billed_amount_by_campaign ?? [];
  const recentOrders = data?.orders_last_3_months ?? [];
  const greetingText = useMemo(
    () => dashboardGreetings[greetingIndex].replace("{user}", displayName),
    [displayName, greetingIndex]
  );
  const weekReferenceDate = useMemo(() => {
    const firstEventDate = weekCalendar[0]?.scheduled_datetime
      ? new Date(weekCalendar[0].scheduled_datetime)
      : new Date();
    return Number.isNaN(firstEventDate.getTime()) ? new Date() : firstEventDate;
  }, [weekCalendar]);
  const visibleWeekDays = useMemo(() => buildWeekDays(weekReferenceDate), [weekReferenceDate]);
  const [selectedWeekDayKey, setSelectedWeekDayKey] = useState<string | null>(null);
  const eventsByDay = useMemo(() => {
    return weekCalendar.reduce(
      (acc, event) => {
        const date = new Date(event.scheduled_datetime);
        if (Number.isNaN(date.getTime())) return acc;
        const key = getDayKey(date);
        acc[key] = acc[key] ?? [];
        acc[key].push(event);
        return acc;
      },
      {} as Record<string, DashboardClass[]>
    );
  }, [weekCalendar]);
  const effectiveSelectedDayKey = useMemo(() => {
    if (selectedWeekDayKey) return selectedWeekDayKey;
    const todayKey = getDayKey(new Date());
    if (visibleWeekDays.some((date) => getDayKey(date) === todayKey)) {
      return todayKey;
    }
    return visibleWeekDays[0] ? getDayKey(visibleWeekDays[0]) : null;
  }, [selectedWeekDayKey, visibleWeekDays]);
  const selectedDayEvents = effectiveSelectedDayKey
    ? eventsByDay[effectiveSelectedDayKey] ?? []
    : [];
  const selectedDayDate = effectiveSelectedDayKey
    ? visibleWeekDays.find((date) => getDayKey(date) === effectiveSelectedDayKey) ?? null
    : null;

  useEffect(() => {
    let currentIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      const nextText = greetingText.slice(
        0,
        deleting ? currentIndex - 1 : currentIndex + 1
      );
      setTypedGreeting(nextText);
      currentIndex = nextText.length;

      if (!deleting && currentIndex === greetingText.length) {
        timeoutId = setTimeout(() => {
          deleting = true;
          tick();
        }, 1800);
        return;
      }

      if (deleting && currentIndex === 0) {
        setGreetingIndex((current) => (current + 1) % dashboardGreetings.length);
        return;
      }

      timeoutId = setTimeout(tick, deleting ? 26 : 58);
    }

    timeoutId = setTimeout(tick, 120);
    return () => clearTimeout(timeoutId);
  }, [greetingText]);

  useEffect(() => {
    if (!visibleWeekDays.length) {
      setSelectedWeekDayKey(null);
      return;
    }

    const selectedStillVisible = selectedWeekDayKey
      ? visibleWeekDays.some((date) => getDayKey(date) === selectedWeekDayKey)
      : false;

    if (!selectedStillVisible) {
      const todayKey = getDayKey(new Date());
      const fallbackKey = visibleWeekDays.some((date) => getDayKey(date) === todayKey)
        ? todayKey
        : getDayKey(visibleWeekDays[0]);
      setSelectedWeekDayKey(fallbackKey);
    }
  }, [selectedWeekDayKey, visibleWeekDays]);

  useEffect(() => {
    setHasCopiedNextClassLink(false);
  }, [nextClassroomLink]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  async function handleCopyNextClassLink() {
    if (!nextClassroomLink) return;
    try {
      await navigator.clipboard.writeText(nextClassroomLink);
      setHasCopiedNextClassLink(true);
      setTimeout(() => setHasCopiedNextClassLink(false), 2000);
    } catch {
      setHasCopiedNextClassLink(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Dashboard
          </p>
          <h1 className="min-h-[3.5rem] text-2xl font-semibold tracking-tight text-foreground drop-shadow-[0_10px_28px_rgba(15,23,42,0.12)] sm:text-3xl">
            {typedGreeting}
            <span className="ml-1 inline-block h-7 w-[2px] animate-pulse bg-primary align-[-4px]" />
          </h1>
        </div>
        <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm md:w-auto md:rounded-full">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            i
          </span>
          Atualizado em {formatDate(new Date().toISOString())}
        </div>
      </div>

      <div className={cn("grid gap-4", isManager ? "xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-3")}>
        <MetricCard
          title="Alunos ativos"
          value={isLoading ? "..." : String(data?.total_active_students ?? 0)}
          accent="sky"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Turmas ativas"
          value={isLoading ? "..." : String(data?.total_active_classes ?? 0)}
          accent="indigo"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <MetricCard
          title="Alunos por turma"
          value={isLoading ? "..." : String(totalStudentsByClass)}
          accent="amber"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        {isManager && (
          <>
            <ManagerMetricCard
              title="Total faturado"
              value={isLoading ? "..." : formatCurrency(data?.total_billed_amount ?? 0)}
              accent="emerald"
              marker="④"
              icon={<CircleDollarSign className="h-5 w-5" />}
              detailA={{
                label: "Hoje",
                value:
                  typeof data?.total_billed_amount_today === "number"
                    ? formatCurrency(data.total_billed_amount_today)
                    : "-",
              }}
              detailB={{
                label: "Ultimos 7 dias",
                value:
                  typeof data?.total_billed_amount_last_7_days === "number"
                    ? formatCurrency(data.total_billed_amount_last_7_days)
                    : "-",
              }}
            />
            <ManagerMetricCard
              title="Interessados ativos / pendentes"
              value={
                isLoading
                  ? "..."
                  : `${data?.total_active_orders ?? 0} / ${data?.total_pending_orders ?? 0}`
              }
              accent="rose"
              marker="⑤"
              icon={<BadgeCheck className="h-5 w-5" />}
              detailA={{
                label: "Hoje",
                value: isLoading ? "..." : String(data?.total_orders_today ?? 0),
              }}
              detailB={{
                label: "Ultimos 7 dias",
                value: isLoading ? "..." : String(data?.total_orders_last_7_days ?? 0),
              }}
            />
          </>
        )}
      </div>

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nao foi possivel carregar os dados do dashboard. Tente novamente.
        </div>
      )}

      {isManager && (
        <div className="grid gap-6 xl:grid-cols-12">
          <ChartPanel
            title="Faturamento por oferta"
            badge="Receita"
            className="xl:col-span-4"
          >
            <VerticalValueBarChart
              items={offerBilling}
              emptyLabel="Nenhuma oferta com faturamento registrada."
              getKey={(item) => item.offer_id}
              getLabel={(item) => item.offer_name}
              getValue={(item) => item.total_billed_amount}
              formatValue={formatCurrency}
              tone="sky"
            />
          </ChartPanel>

          <ChartPanel
            title="Faturamento por campanha"
            badge="Marketing"
            className="xl:col-span-4"
          >
            <DistributionChart
              items={campaignBilling}
              emptyLabel="Nenhuma campanha com faturamento registrada."
              getKey={(item) => item.campaign_id}
              getLabel={(item) => item.campaign_name}
              getValue={(item) => item.total_billed_amount}
              formatValue={formatCurrency}
              tone="violet"
            />
          </ChartPanel>

          <ChartPanel
            title="Ordens nos ultimos 3 meses"
            badge="Pipeline"
            className="xl:col-span-4"
          >
            <OrdersBarChart items={recentOrders} />
          </ChartPanel>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="grid gap-6 xl:col-span-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Alunos por turma ativa</h2>
              </div>
              <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                Distribuicao
              </span>
            </div>
            <div className="mt-6">
              <ActiveClassesPieChart
                items={activeClasses}
                totalStudents={totalStudentsByClass}
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Turmas ativas</h2>
                <p className="text-sm text-muted-foreground">Resumo das turmas em andamento.</p>
              </div>
              <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                {activeClasses.length} turmas
              </span>
            </div>
            <div className="mt-6">
              <ActiveClassesSummary items={activeClasses} />
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 text-white shadow-sm sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Próxima aula</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                {nextClass ? formatWeekday(nextClass.scheduled_datetime) : "-"}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase text-white/60">Aula</p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold">
                    {nextClass ? getClassLabel(nextClass) : "Nenhuma aula agendada"}
                  </p>
                  {nextClassroomLink && (
                    <a
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.03] hover:bg-emerald-300"
                      href={nextClassroomLink}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Entrar na sala"
                      title="Entrar na sala"
                    >
                      <Video className="h-5 w-5" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-white/60">
                  {nextClass ? lessonTypeLabel[nextClass.lesson.lesson_type] : "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase text-white/60">Data e horario</p>
                <p className="text-sm font-medium">{nextClass ? formatDateTime(nextClass.scheduled_datetime) : "-"}</p>
                <p className="mt-2 text-xs text-white/60">{nextClass?.class_notice ?? "Sem observacoes adicionais."}</p>
              </div>
              <div className="flex flex-col gap-2">
                {nextClassroomLink && (
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase text-white/60">Link da sala</p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <a
                        className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-300 underline-offset-4 hover:underline"
                        href={nextClassroomLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {nextClassroomLink}
                      </a>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopyNextClassLink}
                        className="h-9 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        {hasCopiedNextClassLink ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {hasCopiedNextClassLink ? "Copiado" : "Copiar"}
                      </Button>
                    </div>
                  </div>
                )}
                {nextClass?.event_recorded_link && (
                  <a
                    className="rounded-full border border-white/20 px-4 py-2 text-center text-sm text-white"
                    href={nextClass.event_recorded_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver gravacao
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-foreground">Calendario da semana</h3>
              <span className="w-fit rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                7 dias
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {weekCalendar.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">Nenhuma aula programada na semana.</p>
              )}
              {weekCalendar.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {formatMonthLabel(weekReferenceDate.getFullYear(), weekReferenceDate.getMonth())}
                  </p>

                  <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-muted-foreground">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((label) => (
                      <div key={label} className="text-center">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {visibleWeekDays.map((date) => {
                        const dayKey = getDayKey(date);
                        const dayEvents = eventsByDay[dayKey] ?? [];
                        const visibleEvents = dayEvents.slice(0, 2);
                        const isToday = isSameDay(date, new Date());
                        const isSelected = effectiveSelectedDayKey === dayKey;

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            onClick={() => setSelectedWeekDayKey(dayKey)}
                            className={cn(
                              "flex min-h-[96px] flex-col gap-1 rounded-xl border border-border bg-background p-1.5 text-left transition-colors",
                              isToday && "border-primary/40 bg-primary/[0.03]",
                              isSelected && "border-primary bg-primary/[0.06] shadow-sm"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[11px] font-semibold text-muted-foreground",
                                isToday && "text-primary",
                                isSelected && "text-primary"
                              )}
                            >
                              {date.getDate()}
                            </span>
                            <div className="flex flex-1 flex-col gap-0.5">
                              {visibleEvents.map((event) => {
                                const isLive = event.lesson.lesson_type === "live";
                                return (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                                      isLive
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    )}
                                    title={`${formatDateTime(event.scheduled_datetime)} - ${getClassLabel(event)}`}
                                  >
                                    {getClassLabel(event)}
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <div className="truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                                  +{dayEvents.length - 2} mais
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedDayDate
                          ? `Aulas de ${selectedDayDate.toLocaleDateString("pt-BR", {
                              weekday: "long",
                              day: "2-digit",
                              month: "2-digit",
                            })}`
                          : "Aulas do dia"}
                      </p>
                      {selectedDayDate && (
                        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                          {selectedDayEvents.length} aula{selectedDayEvents.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedDayEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma aula programada para este dia.
                        </p>
                      )}
                      {selectedDayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl border border-border/60 bg-card px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {getClassLabel(event)}
                            </p>
                            <span className="whitespace-nowrap text-xs font-semibold text-primary">
                              {new Date(event.scheduled_datetime).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lessonTypeLabel[event.lesson.lesson_type]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="space-y-2">
                  <div className="h-16 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-16 animate-pulse rounded-2xl bg-muted" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  accent,
  icon,
}: {
  title: string;
  value: string;
  accent: "sky" | "indigo" | "amber";
  icon: ReactNode;
}) {
  const accentMap = {
    sky: "from-sky-500/15 text-sky-600 bg-sky-500/15 dark:text-sky-300",
    indigo: "from-indigo-500/15 text-indigo-600 bg-indigo-500/15 dark:text-indigo-300",
    amber: "from-amber-500/15 text-amber-600 bg-amber-500/15 dark:text-amber-300",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br via-transparent to-transparent p-5 shadow-sm dark:border-white/5 sm:p-6",
        accentMap[accent].split(" ")[0]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accentMap[accent].split(" ").slice(1).join(" ")
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ManagerMetricCard({
  title,
  value,
  detailA,
  detailB,
  accent,
  marker,
  icon,
}: {
  title: string;
  value: string;
  detailA: { label: string; value: string };
  detailB: { label: string; value: string };
  accent: "emerald" | "rose";
  marker: string;
  icon?: ReactNode;
}) {
  const accentStyles = {
    emerald: {
      shell: "from-emerald-500/18",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      divider: "border-emerald-500/15",
    },
    rose: {
      shell: "from-rose-500/18",
      badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
      divider: "border-rose-500/15",
    },
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br via-transparent to-transparent p-5 shadow-sm dark:border-white/5 sm:p-6",
        accentStyles[accent].shell
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accentStyles[accent].badge
          )}
        >
          {icon ?? marker}
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold text-foreground">{value}</p>
      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-3 rounded-2xl border bg-background/75 p-3",
          accentStyles[accent].divider
        )}
      >
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{detailA.label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{detailA.value}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{detailB.label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{detailB.value}</p>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  badge,
  className,
  children,
}: {
  title: string;
  badge: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card/95 p-5 shadow-sm sm:p-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {badge}
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function DistributionChart<T>({
  items,
  emptyLabel,
  getKey,
  getLabel,
  getValue,
  formatValue,
  tone,
}: {
  items: T[];
  emptyLabel: string;
  getKey: (item: T) => number | string;
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  formatValue: (value: number) => string;
  tone: "sky" | "violet";
}) {
  const maxValue = Math.max(...items.map(getValue), 0);
  const toneClass =
    tone === "sky"
      ? "from-sky-500 via-cyan-500 to-indigo-500"
      : "from-fuchsia-500 via-violet-500 to-indigo-500";

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const value = getValue(item);
        const percentage = maxValue > 0 ? Math.max(8, Math.round((value / maxValue) * 100)) : 8;
        return (
          <div key={getKey(item)} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-foreground">{getLabel(item)}</span>
              <span className="whitespace-nowrap text-muted-foreground">{formatValue(value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", toneClass)}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerticalValueBarChart<T>({
  items,
  emptyLabel,
  getKey,
  getLabel,
  getValue,
  formatValue,
  tone,
}: {
  items: T[];
  emptyLabel: string;
  getKey: (item: T) => number | string;
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  formatValue: (value: number) => string;
  tone: "sky" | "violet";
}) {
  const [mounted, setMounted] = useState(false);
  const barColor = tone === "sky" ? "#2563EB" : "#8B5CF6";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const chartData = items.map((item) => ({
    key: getKey(item),
    label: getLabel(item),
    shortLabel: getLabel(item),
    value: getValue(item),
    formattedValue: formatValue(getValue(item)),
  }));

  return (
    <div className="h-72 w-full">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 26, right: 8, left: -18, bottom: 30 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.28} />
            <XAxis
              dataKey="shortLabel"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={48}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))", fillOpacity: 0.2 }}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value) => [formatValue(Number(value ?? 0)), "Faturado"]}
              labelFormatter={(_, payload) => String(payload?.[0]?.payload?.label ?? "")}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
              fill={barColor}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            >
              <LabelList
                dataKey="formattedValue"
                position="top"
                offset={10}
                style={{
                  fill: "hsl(var(--foreground))",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function OrdersBarChart({ items }: { items: OrdersLast3Months[] }) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeTheme = theme === "system" ? systemTheme : theme;
  const lineColor = activeTheme === "dark" ? "#3B82F6" : "#2563EB";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma ordem registrada no periodo.</p>;
  }

  const chartData = items.map((item) => ({
    ...item,
    shortMonth: formatShortMonth(item.month),
  }));

  return (
    <div className="space-y-4">
      <div className="h-56 w-full">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 26, right: 10, left: -18, bottom: 10 }}
            >
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
              <XAxis
                dataKey="shortMonth"
                axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.5 }}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={28}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--border))", strokeOpacity: 0.4 }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value) => [`${String(value ?? 0)} ordens`, "Ordens"]}
                labelFormatter={(label) => String(label)}
              />
              <Line
                type="monotone"
                dataKey="total_orders"
                stroke={lineColor}
                strokeWidth={3}
                dot={false}
                activeDot={false}
              >
                <LabelList
                  dataKey="total_orders"
                  position="top"
                  offset={10}
                  style={{
                    fill: "hsl(var(--foreground))",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const PIE_COLORS = [
  "#0ea5e9",
  "#6366f1",
  "#f59e0b",
  "#14b8a6",
  "#f43f5e",
  "#8b5cf6",
  "#22c55e",
  "#eab308",
] as const;

function ActiveClassesPieChart({
  items,
  totalStudents,
  isLoading,
}: {
  items: {
    student_class_id: number;
    course_name: string;
    students_count: number;
  }[];
  totalStudents: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  }

  if (items.length === 0 || totalStudents === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma turma ativa encontrada.</p>;
  }

  let cumulative = 0;
  const segments = items.map((item, index) => {
    const percentage = item.students_count / totalStudents;
    const start = cumulative * 360;
    cumulative += percentage;
    const end = cumulative * 360;
    return {
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length],
      start,
      end,
      percentage: Math.round(percentage * 100),
    };
  });

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}deg ${segment.end}deg`)
    .join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full bg-card">
        <div
          className="flex h-full w-full items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        >
          <div className="flex h-[128px] w-[128px] flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Total
            </span>
            <span className="mt-1 text-3xl font-semibold text-foreground">{totalStudents}</span>
            <span className="text-xs text-muted-foreground">alunos</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.student_class_id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-sm font-medium text-foreground">
                {segment.course_name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{segment.students_count}</p>
              <p className="text-[11px] text-muted-foreground">{segment.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveClassesSummary({
  items,
}: {
  items: {
    student_class_id: number;
    course_name: string;
    teacher_name: string;
    start_date: string;
    finish_date: string;
    time: string;
    students_count: number;
  }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma turma ativa encontrada.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div key={item.student_class_id} className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.course_name}</p>
                <p className="text-xs text-muted-foreground">{item.teacher_name}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {item.students_count} alunos
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p className="uppercase">Periodo</p>
                <p className="text-sm text-foreground">
                  {formatDate(item.start_date)} - {formatDate(item.finish_date)}
                </p>
              </div>
              <div>
                <p className="uppercase">Horario</p>
                <p className="text-sm text-foreground">{item.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Turma</th>
              <th className="px-3 py-3">Professor</th>
              <th className="px-3 py-3">Periodo</th>
              <th className="px-3 py-3">Horario</th>
              <th className="px-3 py-3 text-right">Alunos</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.student_class_id} className="border-t border-border/60">
                <td className="px-3 py-4 font-medium text-foreground">{item.course_name}</td>
                <td className="px-3 py-4 text-muted-foreground">{item.teacher_name}</td>
                <td className="px-3 py-4 text-muted-foreground">
                  {formatDate(item.start_date)} - {formatDate(item.finish_date)}
                </td>
                <td className="px-3 py-4 text-muted-foreground">{item.time}</td>
                <td className="px-3 py-4 text-right font-semibold text-foreground">
                  {item.students_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-[320px] max-w-full animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-2xl bg-muted md:w-64 md:rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`metric-${index}`}
            className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="mt-6 h-9 w-20 animate-pulse rounded-full bg-muted" />
            <div className="mt-3 h-3 w-36 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="grid gap-6 xl:col-span-8 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`chart-${index}`}
              className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted" />
            </div>
          ))}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
            <div className="mt-6 space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 animate-pulse rounded-full bg-muted" />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-6 h-72 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`row-${index}`} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </section>
  );
}
