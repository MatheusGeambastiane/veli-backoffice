"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  GraduationCap,
  HelpCircle,
  MoreVertical,
  Plus,
  ScrollText,
  Users,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
  useClassDetails,
  useClassSubscriptions,
  useCreateClassSubscription,
  useDeleteSubscription,
  useSearchStudentProfiles,
  useUpdateSubscriptionStatus,
} from "@/features/classes/queries/classesQueries";

type ClassDetailsPageProps = {
  classId: string;
};

const DAYS_OF_WEEK_MAP: Record<string, string> = {
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sab",
  Sun: "Dom",
};

const TABS = [
  { id: "matriculas", label: "Matrículas", icon: Users },
  { id: "cronograma", label: "Cronograma", icon: ScrollText },
  { id: "duvidas", label: "Dúvidas", icon: HelpCircle },
  { id: "certificados", label: "Certificados", icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ClassDetailsPage({ classId }: ClassDetailsPageProps) {
  const { data, isLoading, isError } = useClassDetails(classId);
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("matriculas");
  const [hasCopied, setHasCopied] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const deferredStudentSearch = useDeferredValue(studentSearch.trim());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentLookup, setStudentLookup] = useState("");
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const showLoading = status === "loading" || isLoading;
  const {
    data: subscriptions,
    isLoading: isSubscriptionsLoading,
    isError: isSubscriptionsError,
    isFetching: isSubscriptionsFetching,
  } = useClassSubscriptions({
    classId,
    search: deferredStudentSearch || undefined,
  });
  const searchStudents = useSearchStudentProfiles();
  const createSubscription = useCreateClassSubscription(classId);
  const updateSubscriptionStatus = useUpdateSubscriptionStatus(classId);
  const deleteSubscription = useDeleteSubscription(classId);

  const daysOfWeekLabel = useMemo(() => {
    if (!data?.days_of_week?.length) return "Nao informado";
    return data.days_of_week.map((day) => DAYS_OF_WEEK_MAP[day] ?? day).join(", ");
  }, [data?.days_of_week]);

  function formatTime(value?: string | null) {
    if (!value) return "Nao informado";
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  async function handleCopyLink() {
    if (!data?.classroom_link) return;
    try {
      await navigator.clipboard.writeText(data.classroom_link);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
    }
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
    setStudentLookup("");
    searchStudents.reset();
  }

  function handleSearchStudents() {
    const value = studentLookup.trim();
    if (!value) {
      searchStudents.reset();
      return;
    }
    searchStudents.mutate(value);
  }

  function handleOpenDelete(id: number) {
    setDeleteTarget(id);
    setOpenOptionsId(null);
  }

  function handleCloseDelete() {
    setDeleteTarget(null);
  }

  const statusLabelMap = {
    inscrito: "Inscrito",
    estudando: "Estudando",
    finalizado: "Finalizado",
    desistente: "Desistente",
  } as const;

  const statusClassMap = {
    inscrito: "border-yellow-200 bg-yellow-100 text-yellow-800",
    estudando: "border-blue-200 bg-blue-100 text-blue-800",
    finalizado: "border-emerald-200 bg-emerald-100 text-emerald-800",
    desistente: "border-red-200 bg-red-100 text-red-800",
  } as const;

  return (
    <section className="space-y-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/classes"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para turmas
          </Link>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Detalhes da turma</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {data?.course_name ?? "Turma"}
            </h1>
          </div>
        </div>

        {showLoading && (
          <div className="space-y-3 rounded-3xl border border-border bg-card px-5 py-6 shadow-sm">
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!showLoading && isError && (
          <div className="rounded-3xl border border-border bg-card px-5 py-6 text-sm text-destructive shadow-sm">
            Erro ao carregar detalhes da turma.
          </div>
        )}

        {!showLoading && !isError && data && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  {data.language_icon_url ? (
                    <img
                      src={data.language_icon_url}
                      alt={data.course_name}
                      className="h-14 w-14 rounded-2xl border border-border object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl border border-border bg-muted" />
                  )}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Curso
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {data.course_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {data.teacher_profile_pic_url ? (
                        <img
                          src={data.teacher_profile_pic_url}
                          alt={data.teacher_full_name ?? "Professor"}
                          className="h-10 w-10 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-border bg-muted" />
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-wide">Professor(a)</p>
                        <p className="text-sm font-medium text-foreground">
                          {data.teacher_full_name ?? "Nao informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    data.is_active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {data.is_active ? "Turma ativa" : "Turma inativa"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Inicio</p>
                  <p className="text-sm font-semibold text-foreground">{data.start_date}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Fim</p>
                  <p className="text-sm font-semibold text-foreground">{data.finish_date}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Horario</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTime(data.time)} • {data.duration} min
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Dias</p>
                  <p className="text-sm font-semibold text-foreground">{daysOfWeekLabel}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3 sm:col-span-2 lg:col-span-4">
                  <p className="text-xs uppercase tracking-wide">Link da sala</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {data.classroom_link ? (
                      <a
                        href={data.classroom_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        {data.classroom_link}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">Nao informado</p>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      disabled={!data.classroom_link}
                      className="h-8"
                    >
                      {hasCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {hasCopied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card px-5 py-6 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total de alunos
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {data.total_students ?? 0}
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-card px-5 py-6 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Proxima aula
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {data.next_class ?? "Nao definida"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-center transition-colors",
                      activeTab === tab.id
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    <p className="text-sm font-semibold text-foreground">{tab.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              {activeTab === "matriculas" ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">Matrículas</p>
                        <p className="text-sm text-muted-foreground">
                          {subscriptions?.length ?? 0} estudante
                          {subscriptions?.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4" />
                        Criar matrícula
                      </Button>
                    </div>
                    <Input
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Buscar estudante"
                      className="h-11 rounded-2xl"
                      aria-label="Buscar estudante"
                    />
                  </div>

                  {(status === "loading" || isSubscriptionsLoading) && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Carregando estudantes...
                    </div>
                  )}

                  {status !== "loading" && isSubscriptionsError && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      Erro ao carregar matrículas.
                    </div>
                  )}

                  {status !== "loading" &&
                    !isSubscriptionsLoading &&
                    !isSubscriptionsError && (
                      <div className="space-y-3">
                        {isSubscriptionsFetching && (
                          <p className="text-xs font-medium text-primary">
                            Atualizando resultados...
                          </p>
                        )}
                        {subscriptions?.length ? (
                          <div className="space-y-3">
                            <div className="hidden grid-cols-[minmax(0,1fr)_160px_80px] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                              <span>Nome</span>
                              <span>Status</span>
                              <span>Opções</span>
                            </div>
                            <ul className="space-y-3">
                              {subscriptions.map((subscription) => (
                                <li
                                  key={subscription.id}
                                  className="grid gap-3 rounded-2xl border border-border bg-background px-4 py-3 sm:grid-cols-[minmax(0,1fr)_160px_80px] sm:items-center"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
                                      {subscription.student.profile_pic ? (
                                        <img
                                          src={subscription.student.profile_pic}
                                          alt={subscription.student.full_name}
                                          className="h-11 w-11 rounded-full object-cover"
                                        />
                                      ) : (
                                        <User className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {subscription.student.full_name}
                                    </p>
                                  </div>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenStatusId((current) =>
                                          current === subscription.id ? null : subscription.id
                                        )
                                      }
                                      className={cn(
                                        "flex w-full items-center justify-between gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                                        statusClassMap[subscription.status]
                                      )}
                                      aria-haspopup="menu"
                                      aria-expanded={openStatusId === subscription.id}
                                    >
                                      {statusLabelMap[subscription.status]}
                                      </button>

                                      {openStatusId === subscription.id && (
                                        <div
                                          className="absolute right-0 top-10 z-20 w-full min-w-[160px] rounded-2xl border border-border bg-card p-2 shadow-lg"
                                          role="menu"
                                        >
                                        {(
                                          [
                                            "inscrito",
                                            "estudando",
                                            "finalizado",
                                            "desistente",
                                          ] as const
                                        ).map((statusOption) => (
                                          <button
                                            key={statusOption}
                                            type="button"
                                            onClick={() => {
                                              setOpenStatusId(null);
                                              if (statusOption === subscription.status) return;
                                              updateSubscriptionStatus.mutate({
                                                id: subscription.id,
                                                status: statusOption,
                                              });
                                            }}
                                            className={cn(
                                              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors",
                                              statusOption === subscription.status
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-accent/60 text-muted-foreground"
                                            )}
                                            role="menuitem"
                                          >
                                            {statusLabelMap[statusOption]}
                                          </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  <div className="relative flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenOptionsId((current) =>
                                          current === subscription.id ? null : subscription.id
                                        )
                                      }
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                      aria-haspopup="menu"
                                      aria-expanded={openOptionsId === subscription.id}
                                      aria-label="Opções da matrícula"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                    {openOptionsId === subscription.id && (
                                      <div
                                        className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-border bg-card p-2 shadow-lg"
                                        role="menu"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDelete(subscription.id)}
                                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/10"
                                          role="menuitem"
                                        >
                                          Apagar matrícula
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                            Nenhum estudante encontrado para os filtros atuais.
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">Em breve</p>
                  <p className="text-sm text-muted-foreground">
                    Estamos preparando essa seção para a turma.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-subscription-title"
          onClick={handleCloseCreate}
        >
          <div
            className="w-full max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nova matrícula</p>
                <h2
                  id="create-subscription-title"
                  className="text-xl font-semibold text-foreground"
                >
                  Criar matrícula
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseCreate}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar modal"
              >
                X
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={studentLookup}
                onChange={(event) => setStudentLookup(event.target.value)}
                placeholder="Buscar estudante"
                className="h-11 flex-1 rounded-2xl"
                aria-label="Buscar estudante no cadastro"
              />
              <Button
                type="button"
                onClick={handleSearchStudents}
                disabled={!studentLookup.trim() || searchStudents.isPending}
              >
                {searchStudents.isPending ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {searchStudents.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Erro ao buscar estudantes.
              </div>
            )}

            {!searchStudents.isPending &&
              !searchStudents.isError &&
              searchStudents.data &&
              searchStudents.data.results.length === 0 && (
                <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  Nenhum estudante encontrado para o termo informado.
                </div>
              )}

            {searchStudents.data && searchStudents.data.results.length > 0 && (
              <fieldset className="max-h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-border bg-background p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resultados
                </legend>
                <ul className="space-y-3">
                  {searchStudents.data.results.map((result) => (
                    <li
                      key={result.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
                          {result.user.profile_pic ? (
                            <img
                              src={result.user.profile_pic}
                              alt={`${result.user.first_name} ${result.user.last_name}`}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {result.user.first_name} {result.user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.user.email}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          createSubscription.mutate({
                            student_profile: result.id,
                          })
                        }
                        disabled={createSubscription.isPending}
                      >
                        {createSubscription.isPending ? "Matriculando..." : "Matricular aluno"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-subscription-title"
          onClick={handleCloseDelete}
        >
          <div
            className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2
                id="delete-subscription-title"
                className="text-xl font-semibold text-foreground"
              >
                Tem certeza que deseja apagar esta matricula?
              </h2>
              <p className="text-sm text-muted-foreground">
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            {deleteSubscription.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Erro ao apagar matrícula. Tente novamente.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={handleCloseDelete}
                disabled={deleteSubscription.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  deleteSubscription.mutate(deleteTarget, {
                    onSuccess: handleCloseDelete,
                  })
                }
                disabled={deleteSubscription.isPending}
              >
                {deleteSubscription.isPending ? "Apagando..." : "Apagar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
