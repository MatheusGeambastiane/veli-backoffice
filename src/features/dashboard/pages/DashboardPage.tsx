"use client";

import { useMemo } from "react";
import { useDashboardSummary } from "@/features/dashboard/queries/dashboardQueries";
import type { DashboardClass } from "@/features/dashboard/types/dashboardTypes";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
const weekDayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

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

function getClassLabel(item: DashboardClass) {
  const lessonName = item.lesson?.name ?? "Aula";
  const courseName = item.student_class?.course_name ?? "Turma";
  return `${lessonName} · ${courseName}`;
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary();

  const totalStudentsByClass = useMemo(() => {
    return data?.students_by_active_class?.reduce((total, item) => total + item.students_count, 0) ?? 0;
  }, [data]);

  const nextClass = data?.next_class ?? null;
  const weekCalendar = data?.week_calendar ?? [];
  const activeClasses = data?.students_by_active_class ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Visao geral</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Acompanhe as turmas, aulas e alunos ativos.</p>
        </div>
        <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm md:w-auto md:rounded-full">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            i
          </span>
          Atualizado em {formatDate(new Date().toISOString())}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-transparent to-transparent p-5 shadow-sm dark:border-white/5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Alunos ativos</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
              ①
            </span>
          </div>
          <p className="mt-6 text-3xl font-semibold text-foreground">
            {isLoading ? "..." : data?.total_active_students ?? 0}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Base de alunos ativos no momento.</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-transparent to-transparent p-5 shadow-sm dark:border-white/5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Turmas ativas</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
              ②
            </span>
          </div>
          <p className="mt-6 text-3xl font-semibold text-foreground">
            {isLoading ? "..." : data?.total_active_classes ?? 0}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Quantidade de turmas em andamento.</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-transparent to-transparent p-5 shadow-sm dark:border-white/5 sm:col-span-2 sm:p-6 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Alunos por turma</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
              ③
            </span>
          </div>
          <p className="mt-6 text-3xl font-semibold text-foreground">
            {isLoading ? "..." : totalStudentsByClass}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Total somado das turmas ativas.</p>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nao foi possivel carregar os dados do dashboard. Tente novamente.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-6 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Alunos por turma ativa</h2>
              <p className="text-sm text-muted-foreground">Distribuicao de alunos nas turmas atuais.</p>
            </div>
            <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              Semana atual
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {(activeClasses.length === 0 && !isLoading) && (
              <p className="text-sm text-muted-foreground">Nenhuma turma ativa encontrada.</p>
            )}
            {activeClasses.slice(0, 6).map((item) => {
              const percentage = totalStudentsByClass
                ? Math.round((item.students_count / totalStudentsByClass) * 100)
                : 0;

              return (
                <div key={item.student_class_id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.course_name}</span>
                    <span className="text-muted-foreground">{item.students_count} alunos</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                      style={{ width: `${Math.max(percentage, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="space-y-3">
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 text-white shadow-sm sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Proxima aula</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                {nextClass ? formatWeekday(nextClass.scheduled_datetime) : "-"}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase text-white/60">Aula</p>
                <p className="text-lg font-semibold">
                  {nextClass ? getClassLabel(nextClass) : "Nenhuma aula agendada"}
                </p>
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
                {nextClass?.classroom_link && (
                  <a
                    className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900"
                    href={nextClass.classroom_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Entrar na sala
                  </a>
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
            <div className="mt-4 space-y-3">
              {weekCalendar.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">Nenhuma aula programada na semana.</p>
              )}
              {weekCalendar.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">{formatWeekday(item.scheduled_datetime)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.scheduled_datetime)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{getClassLabel(item)}</p>
                </div>
              ))}
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

      <div className="rounded-3xl border border-border bg-card/95 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Turmas ativas</h2>
            <p className="text-sm text-muted-foreground">Resumo das turmas em andamento.</p>
          </div>
          <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            {activeClasses.length} turmas
          </span>
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {activeClasses.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-border/60 bg-background px-4 py-5 text-sm text-muted-foreground">
              Nenhuma turma ativa no momento.
            </div>
          )}
          {activeClasses.map((item) => (
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
          {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-muted" />}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm lg:min-w-[720px]">
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
              {activeClasses.length === 0 && !isLoading && (
                <tr>
                  <td className="px-3 py-6 text-sm text-muted-foreground" colSpan={5}>
                    Nenhuma turma ativa no momento.
                  </td>
                </tr>
              )}
              {activeClasses.map((item) => (
                <tr key={item.student_class_id} className="border-t border-border/60">
                  <td className="px-3 py-4 font-medium text-foreground">{item.course_name}</td>
                  <td className="px-3 py-4 text-muted-foreground">{item.teacher_name}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {formatDate(item.start_date)} - {formatDate(item.finish_date)}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{item.time}</td>
                  <td className="px-3 py-4 text-right font-semibold text-foreground">{item.students_count}</td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td className="px-3 py-6" colSpan={5}>
                    <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
