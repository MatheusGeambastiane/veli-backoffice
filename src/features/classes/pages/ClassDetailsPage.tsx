"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  MoreVertical,
  Pencil,
  Plus,
  ScrollText,
  Users,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { HttpError } from "@/shared/lib/http/http";
import { cn } from "@/shared/lib/utils";
import {
  useClassDetails,
  useClassSubscriptions,
  useCoursesSimple,
  useCreateClassSubscription,
  useCreateDoubtAnswer,
  useDeleteSubscription,
  useEventDetails,
  useGenerateSchedule,
  useLessonDoubtsByClass,
  useSearchStudentProfiles,
  useScheduleByClass,
  useTeacherProfilesSimple,
  useUpdateClassDetails,
  useUpdateEvent,
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

const DAYS_OF_WEEK_OPTIONS = [
  { value: "Mon", short: "S", label: "Segunda" },
  { value: "Tue", short: "T", label: "Terca" },
  { value: "Wed", short: "Q", label: "Quarta" },
  { value: "Thu", short: "Q", label: "Quinta" },
  { value: "Fri", short: "S", label: "Sexta" },
  { value: "Sat", short: "S", label: "Sabado" },
  { value: "Sun", short: "D", label: "Domingo" },
];

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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isDaysModalOpen, setIsDaysModalOpen] = useState(false);
  const [classroomLink, setClassroomLink] = useState("");
  const [selectedScheduleEventId, setSelectedScheduleEventId] = useState<number | null>(
    null
  );
  const [openScheduleEventId, setOpenScheduleEventId] = useState<number | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventFieldsEditable, setEventFieldsEditable] = useState<
    Record<"scheduled_datetime" | "event_recorded_link" | "lesson_content" | "class_notice", boolean>
  >({
    scheduled_datetime: false,
    event_recorded_link: false,
    lesson_content: false,
    class_notice: false,
  });
  const [eventScheduledDatetime, setEventScheduledDatetime] = useState("");
  const [eventRecordedLink, setEventRecordedLink] = useState("");
  const [eventClassNotice, setEventClassNotice] = useState("");
  const [eventLessonContentFile, setEventLessonContentFile] = useState<File | null>(null);
  const [eventSaveError, setEventSaveError] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [activeCalendarIndex, setActiveCalendarIndex] = useState(0);
  const [expandedCalendarDayKey, setExpandedCalendarDayKey] = useState<string | null>(null);
  const [expandedDoubtAnswers, setExpandedDoubtAnswers] = useState<Record<number, boolean>>({});
  const [openReplyDoubtId, setOpenReplyDoubtId] = useState<number | null>(null);
  const [replyByDoubt, setReplyByDoubt] = useState<Record<number, string>>({});
  const [replySubmittingByDoubt, setReplySubmittingByDoubt] = useState<Record<number, boolean>>(
    {}
  );
  const [replyError, setReplyError] = useState<string | null>(null);
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
  const coursesSimple = useCoursesSimple();
  const teacherProfilesSimple = useTeacherProfilesSimple();
  const updateClassDetails = useUpdateClassDetails(classId);
  const scheduleByClass = useScheduleByClass(classId);
  const generateSchedule = useGenerateSchedule();
  const lessonDoubtsByClass = useLessonDoubtsByClass(classId);
  const createDoubtAnswer = useCreateDoubtAnswer(classId);
  const lessonContentInputRef = useRef<HTMLInputElement | null>(null);
  const eventDetails = useEventDetails(openScheduleEventId ? String(openScheduleEventId) : "");
  const updateEvent = useUpdateEvent(
    classId,
    openScheduleEventId ? String(openScheduleEventId) : ""
  );

  const daysOfWeekLabel = useMemo(() => {
    if (!data?.days_of_week?.length) return "Nao informado";
    return data.days_of_week.map((day) => DAYS_OF_WEEK_MAP[day] ?? day).join(", ");
  }, [data?.days_of_week]);

  const selectedDaysLabel = useMemo(() => {
    if (!selectedDays.length) return "Selecionar dias";
    return selectedDays.map((day) => DAYS_OF_WEEK_MAP[day] ?? day).join(", ");
  }, [selectedDays]);


  function formatTime(value?: string | null) {
    if (!value) return "Nao informado";
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  function formatNextClass(value: unknown) {
    if (!value) return "Nao definida";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const event = value as {
        scheduled_datetime?: string;
        lesson?: { name?: string };
      };

      if (event.scheduled_datetime) {
        const formattedDate = new Date(event.scheduled_datetime).toLocaleString("pt-BR", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        return event.lesson?.name ? `${formattedDate} • ${event.lesson.name}` : formattedDate;
      }
    }
    return "Nao definida";
  }

  function normalizeDays(days: string[] | undefined) {
    if (!days?.length) return [];
    const ordered = DAYS_OF_WEEK_OPTIONS.map((option) => option.value);
    return ordered.filter((day) => days.includes(day));
  }

  function normalizeDate(value: string | null | undefined) {
    if (!value) return "";
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  function syncFormWithData() {
    if (!data) return;
    setSelectedCourseId(data.course);
    setSelectedTeacherId(data.teacher_profile ?? "");
    setStartDate(normalizeDate(data.start_date));
    setFinishDate(normalizeDate(data.finish_date));
    setClassTime(data.time ? data.time.slice(0, 5) : "");
    setSelectedDays(normalizeDays(data.days_of_week));
    setClassroomLink(data.classroom_link ?? "");
  }

  function formatTimeForApi(value: string) {
    if (!value) return value;
    return value.length === 5 ? `${value}:00` : value;
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

  function handleStartEdit() {
    if (!data) return;
    syncFormWithData();
    setIsEditing(true);
  }

  function handleCancelEdit() {
    syncFormWithData();
    setIsEditing(false);
    setIsDaysModalOpen(false);
  }

  function handleToggleDay(day: string) {
    setSelectedDays((current) => {
      const next = current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day];
      return normalizeDays(next);
    });
  }

  function handleSaveEdit() {
    if (
      !data ||
      !selectedCourseId ||
      !startDate ||
      !finishDate ||
      !classTime ||
      selectedDays.length === 0
    )
      return;
    updateClassDetails.mutate(
      {
        course: Number(selectedCourseId),
        teacher_profile: selectedTeacherId ? Number(selectedTeacherId) : null,
        start_date: startDate,
        finish_date: finishDate,
        time: formatTimeForApi(classTime),
        days_of_week: selectedDays,
        is_active: data.is_active,
        duration: data.duration,
        classroom_link: classroomLink.trim() || null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  }

  function handleGenerateSchedule() {
    if (!data) return;
    setScheduleMessage(null);
    generateSchedule.mutate(
      { student_class: data.id },
      {
        onSuccess: (response) => {
          const detail =
            response && typeof response.detail === "string"
              ? response.detail
              : "Estamos gerando, quando tiver pronto voce sera notificado.";
          setScheduleMessage(detail);
        },
      }
    );
  }

  function toDatetimeLocal(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (unit: number) => String(unit).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  function resetEventEditState() {
    setEventFieldsEditable({
      scheduled_datetime: false,
      event_recorded_link: false,
      lesson_content: false,
      class_notice: false,
    });
    setEventSaveError(null);
    setEventLessonContentFile(null);
  }

  function syncEventFormWithData() {
    const event = eventDetails.data;
    if (!event) return;
    setEventScheduledDatetime(toDatetimeLocal(event.scheduled_datetime));
    setEventRecordedLink(event.event_recorded_link ?? "");
    setEventClassNotice(event.class_notice ?? "");
    setEventLessonContentFile(null);
  }

  function handleOpenEventModal(eventId: number) {
    setOpenScheduleEventId(eventId);
    setIsEventModalOpen(true);
    setEventSaveError(null);
  }

  function handleCloseEventModal() {
    setIsEventModalOpen(false);
    setOpenScheduleEventId(null);
    resetEventEditState();
  }

  function handleEnableEventFieldEdit(
    field: "scheduled_datetime" | "event_recorded_link" | "lesson_content" | "class_notice"
  ) {
    setEventFieldsEditable((current) => ({ ...current, [field]: true }));
  }

  function handleCancelEventEdit() {
    syncEventFormWithData();
    resetEventEditState();
  }

  function handleSaveEventChanges() {
    if (!openScheduleEventId) return;
    const hasAnyFieldOpen = Object.values(eventFieldsEditable).some(Boolean);
    if (!hasAnyFieldOpen || updateEvent.isPending) return;

    const formData = new FormData();
    if (eventFieldsEditable.scheduled_datetime && eventScheduledDatetime) {
      formData.append("scheduled_datetime", new Date(eventScheduledDatetime).toISOString());
    }
    if (eventFieldsEditable.event_recorded_link) {
      formData.append("event_recorded_link", eventRecordedLink.trim());
    }
    if (eventFieldsEditable.class_notice) {
      formData.append("class_notice", eventClassNotice.trim());
    }
    if (eventFieldsEditable.lesson_content && eventLessonContentFile) {
      formData.append("lesson_content", eventLessonContentFile);
    }

    if (!Array.from(formData.keys()).length) {
      setEventSaveError("Nenhuma alteracao valida para salvar.");
      return;
    }

    setEventSaveError(null);
    updateEvent.mutate(formData, {
      onSuccess: () => {
        syncEventFormWithData();
        resetEventEditState();
      },
      onError: () => {
        setEventSaveError("Erro ao salvar evento. Tente novamente.");
      },
    });
  }

  useEffect(() => {
    if (!eventDetails.data) return;
    syncEventFormWithData();
  }, [eventDetails.data]);

  useEffect(() => {
    setExpandedCalendarDayKey(null);
  }, [activeCalendarIndex]);

  function handleToggleDoubtAnswers(doubtId: number) {
    setExpandedDoubtAnswers((current) => ({ ...current, [doubtId]: !current[doubtId] }));
  }

  function handleToggleReplyInput(doubtId: number) {
    setReplyError(null);
    setOpenReplyDoubtId((current) => (current === doubtId ? null : doubtId));
  }

  function handleReplyChange(doubtId: number, value: string) {
    setReplyByDoubt((current) => ({ ...current, [doubtId]: value }));
  }

  function handleSubmitReply(doubtId: number) {
    const comment = (replyByDoubt[doubtId] ?? "").trim();
    if (!comment) {
      setReplyError("Digite uma resposta antes de enviar.");
      return;
    }

    if (replySubmittingByDoubt[doubtId]) return;

    setReplyError(null);
    setReplySubmittingByDoubt((current) => ({ ...current, [doubtId]: true }));
    createDoubtAnswer.mutate(
      { lesson_doubt: doubtId, comment },
      {
        onSuccess: () => {
          setReplyByDoubt((current) => ({ ...current, [doubtId]: "" }));
          setOpenReplyDoubtId(null);
          setExpandedDoubtAnswers((current) => ({ ...current, [doubtId]: true }));
        },
        onError: () => {
          setReplyError("Erro ao enviar resposta. Tente novamente.");
        },
        onSettled: () => {
          setReplySubmittingByDoubt((current) => ({ ...current, [doubtId]: false }));
        },
      }
    );
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

  const isSaveDisabled =
    updateClassDetails.isPending ||
    !selectedCourseId ||
    !startDate ||
    !finishDate ||
    !classTime ||
    selectedDays.length === 0;

  const sortedScheduleEvents = useMemo(() => {
    if (!scheduleByClass.data?.events?.length) return [];
    return [...scheduleByClass.data.events].sort(
      (a, b) =>
        new Date(a.scheduled_datetime).getTime() -
        new Date(b.scheduled_datetime).getTime()
    );
  }, [scheduleByClass.data]);

  const selectedScheduleEvents = useMemo(() => {
    if (!selectedScheduleEventId) return sortedScheduleEvents;
    return sortedScheduleEvents.filter((event) => event.id === selectedScheduleEventId);
  }, [selectedScheduleEventId, sortedScheduleEvents]);

  const calendarMonths = useMemo(() => {
    if (!sortedScheduleEvents.length) return [];
    const monthMap = new Map<string, typeof sortedScheduleEvents>();

    sortedScheduleEvents.forEach((event) => {
      const date = new Date(event.scheduled_datetime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const list = monthMap.get(key) ?? [];
      list.push(event);
      monthMap.set(key, list);
    });

    return Array.from(monthMap.entries())
      .map(([key, events]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        key,
        year,
        month,
        events,
      };
      })
      .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  }, [sortedScheduleEvents]);

  const activeMonth = calendarMonths[activeCalendarIndex];
  const eventsByDay = useMemo(() => {
    if (!activeMonth?.events?.length) return {} as Record<string, typeof sortedScheduleEvents>;
    return activeMonth.events.reduce(
      (acc, event) => {
        const key = getDayKey(new Date(event.scheduled_datetime));
        acc[key] = acc[key] ?? [];
        acc[key].push(event);
        return acc;
      },
      {} as Record<string, typeof sortedScheduleEvents>
    );
  }, [activeMonth, sortedScheduleEvents]);
  const hasEventFieldEditingEnabled = Object.values(eventFieldsEditable).some(Boolean);
  const scheduleErrorDetail =
    scheduleByClass.error instanceof HttpError &&
    scheduleByClass.error.details &&
    typeof scheduleByClass.error.details === "object" &&
    "detail" in scheduleByClass.error.details
      ? String(scheduleByClass.error.details.detail)
      : null;
  const isScheduleMissing =
    scheduleErrorDetail === "Cronograma não encontrado para esta turma.";

  function formatMonthLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  function buildCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingEmptyDays = (startWeekday + 6) % 7;
    const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - leadingEmptyDays + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return new Date(year, month - 1, dayNumber);
    });
  }

  function getDayKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  function handleOpenCalendarEvent(eventId: number) {
    const isSelected = selectedScheduleEventId === eventId;
    setSelectedScheduleEventId(isSelected ? null : eventId);
    handleOpenEventModal(eventId);
  }

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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Detalhes da turma</p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {data?.course_name ?? "Turma"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10"
                    onClick={handleCancelEdit}
                    disabled={updateClassDetails.isPending}
                  >
                    Cancelar alteracoes
                  </Button>
                  <Button
                    type="button"
                    className="h-10"
                    onClick={handleSaveEdit}
                    disabled={isSaveDisabled}
                  >
                    {updateClassDetails.isPending ? "Salvando..." : "Salvar alteracoes"}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" className="h-10" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4" />
                  Editar turma
                </Button>
              )}
            </div>
          </div>
          {updateClassDetails.isError && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Erro ao salvar as alteracoes da turma. Tente novamente.
            </div>
          )}
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
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Curso
                      </p>
                      {isEditing ? (
                        <select
                          value={selectedCourseId}
                          onChange={(event) =>
                            setSelectedCourseId(
                              event.target.value ? Number(event.target.value) : ""
                            )
                          }
                          className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground focus:outline-none"
                          aria-label="Selecionar curso"
                          disabled={coursesSimple.isLoading}
                        >
                          <option value="">
                            {coursesSimple.isLoading
                              ? "Carregando cursos..."
                              : "Selecione o curso"}
                          </option>
                          {coursesSimple.data?.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xl font-semibold text-foreground">
                          {data.course_name}
                        </p>
                      )}
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
                        {isEditing ? (
                          <select
                            value={selectedTeacherId}
                            onChange={(event) =>
                              setSelectedTeacherId(
                                event.target.value ? Number(event.target.value) : ""
                              )
                            }
                            className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground focus:outline-none"
                            aria-label="Selecionar professor"
                            disabled={teacherProfilesSimple.isLoading}
                          >
                            <option value="">
                              {teacherProfilesSimple.isLoading
                                ? "Carregando professores..."
                                : "Selecione o professor"}
                            </option>
                            {teacherProfilesSimple.data?.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.full_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-foreground">
                            {data.teacher_full_name ?? "Nao informado"}
                          </p>
                        )}
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
                  {isEditing ? (
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="mt-2 h-11 rounded-2xl"
                      aria-label="Data de inicio"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{data.start_date}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Fim</p>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={finishDate}
                      onChange={(event) => setFinishDate(event.target.value)}
                      className="mt-2 h-11 rounded-2xl"
                      aria-label="Data de fim"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{data.finish_date}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Horario</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="time"
                        value={classTime}
                        onChange={(event) => setClassTime(event.target.value)}
                        className="mt-2 h-11 rounded-2xl"
                        aria-label="Horario da turma"
                      />
                      <p className="text-xs text-muted-foreground">
                        Duracao: {data.duration} min
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {formatTime(data.time)} • {data.duration} min
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="text-xs uppercase tracking-wide">Dias</p>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsDaysModalOpen(true)}
                      className="mt-2 flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/60"
                      aria-label="Selecionar dias da semana"
                    >
                      <span>{selectedDaysLabel}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Editar
                      </span>
                    </button>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{daysOfWeekLabel}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border bg-background px-4 py-3 sm:col-span-2 lg:col-span-4">
                  <p className="text-xs uppercase tracking-wide">Link da sala</p>
                  {isEditing ? (
                    <Input
                      type="url"
                      value={classroomLink}
                      onChange={(event) => setClassroomLink(event.target.value)}
                      placeholder="https://"
                      className="mt-2 h-11 rounded-2xl"
                      aria-label="Link da sala"
                    />
                  ) : (
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
                        <p className="text-sm font-semibold text-foreground">
                          Nao informado
                        </p>
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
                  )}
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
                  {formatNextClass(data.next_class)}
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

                  {isSubscriptionsLoading && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Carregando estudantes...
                    </div>
                  )}

                  {isSubscriptionsError && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      Erro ao carregar matrículas.
                    </div>
                  )}

                  {!isSubscriptionsLoading &&
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
              ) : activeTab === "cronograma" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Cronograma</p>
                      <p className="text-sm text-muted-foreground">
                        {scheduleByClass.data?.events?.length ?? 0} aula
                        {scheduleByClass.data?.events?.length === 1 ? "" : "s"} planejada
                        {scheduleByClass.data?.events?.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGenerateSchedule}
                      disabled={
                        generateSchedule.isPending ||
                        scheduleByClass.isLoading
                      }
                    >
                      {generateSchedule.isPending
                        ? "Gerando..."
                        : "Criar cronograma automaticamente"}
                    </Button>
                  </div>

                  {scheduleMessage && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                      {scheduleMessage}
                    </div>
                  )}

                  {scheduleByClass.isLoading && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Carregando cronograma...
                    </div>
                  )}

                  {scheduleByClass.isError && !isScheduleMissing && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      Erro ao carregar cronograma.
                    </div>
                  )}

                  {isScheduleMissing && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Essa turma ainda não tem um cronograma.
                    </div>
                  )}

                  {!scheduleByClass.isLoading &&
                    !scheduleByClass.isError && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            Por calendario
                          </p>
                          {calendarMonths.length && activeMonth ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setActiveCalendarIndex((current) =>
                                      Math.max(0, current - 1)
                                    )
                                  }
                                  disabled={activeCalendarIndex === 0}
                                  className="h-8 w-8 rounded-full p-0"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <p className="text-sm font-semibold text-foreground capitalize">
                                  {formatMonthLabel(activeMonth.year, activeMonth.month)}
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setActiveCalendarIndex((current) =>
                                      Math.min(calendarMonths.length - 1, current + 1)
                                    )
                                  }
                                  disabled={activeCalendarIndex >= calendarMonths.length - 1}
                                  className="h-8 w-8 rounded-full p-0"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-muted-foreground">
                                {[
                                  "Seg",
                                  "Ter",
                                  "Qua",
                                  "Qui",
                                  "Sex",
                                  "Sab",
                                  "Dom",
                                ].map((label) => (
                                  <div key={label} className="text-center">
                                    {label}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {buildCalendarDays(activeMonth.year, activeMonth.month).map(
                                  (date, index) => {
                                    if (!date) {
                                      return (
                                        <div
                                          key={`empty-${activeMonth.key}-${index}`}
                                          className="h-14 rounded-xl border border-dashed border-border/60 bg-muted/20"
                                        />
                                      );
                                    }
                                    const dayKey = getDayKey(date);
                                    const events = eventsByDay[dayKey] ?? [];
                                    const visibleEvents = events.slice(0, 2);
                                    const hiddenEvents = events.slice(2);
                                    const isDayExpanded = expandedCalendarDayKey === dayKey;
                                    const displayedEvents = isDayExpanded ? events : visibleEvents;

                                    return (
                                      <div
                                        key={dayKey}
                                        className="flex min-h-[88px] flex-col gap-1 rounded-xl border border-border bg-background p-1.5"
                                      >
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                          {date.getDate()}
                                        </span>
                                        <div className="flex flex-1 flex-col gap-0.5">
                                          {displayedEvents.map((event) => {
                                            const isSelected = selectedScheduleEventId === event.id;
                                            const isLive = event.lesson.lesson_type === "live";
                                            return (
                                              <button
                                                key={event.id}
                                                type="button"
                                                onClick={() => handleOpenCalendarEvent(event.id)}
                                                className={cn(
                                                  "truncate rounded-md px-1.5 py-0.5 text-left text-[9px] font-semibold transition-colors",
                                                  isSelected
                                                    ? "bg-primary/15 text-primary"
                                                    : isLive
                                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                )}
                                                title={event.lesson.name}
                                              >
                                                {event.lesson.name}
                                              </button>
                                            );
                                          })}
                                          {!isDayExpanded && hiddenEvents.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedCalendarDayKey(dayKey)}
                                              className="truncate rounded-md px-1.5 py-0.5 text-left text-[9px] font-semibold text-primary transition-colors hover:bg-primary/10"
                                              aria-expanded={isDayExpanded}
                                              aria-label={`Ver mais eventos de ${date.toLocaleDateString(
                                                "pt-BR"
                                              )}`}
                                            >
                                              +{hiddenEvents.length} mais
                                            </button>
                                          )}
                                          {isDayExpanded && hiddenEvents.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedCalendarDayKey(null)}
                                              className="truncate rounded-md px-1.5 py-0.5 text-left text-[9px] font-semibold text-primary transition-colors hover:bg-primary/10"
                                              aria-expanded={isDayExpanded}
                                              aria-label={`Ocultar eventos de ${date.toLocaleDateString(
                                                "pt-BR"
                                              )}`}
                                            >
                                              Mostrar menos
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                              Nenhum evento encontrado para esta turma.
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">Lista</p>
                            {selectedScheduleEventId && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedScheduleEventId(null)}
                              >
                                Ver todos
                              </Button>
                            )}
                          </div>
                          {selectedScheduleEvents.length ? (
                            <ul className="space-y-3">
                              {selectedScheduleEvents.map((event) => {
                                const isLive = event.lesson.lesson_type === "live";
                                return (
                                  <li
                                    key={event.id}
                                    className="cursor-pointer rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
                                    onClick={() => handleOpenEventModal(event.id)}
                                  >
                                    <p className="text-sm font-semibold text-foreground">
                                      {event.lesson.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(event.scheduled_datetime).toLocaleString("pt-BR", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </p>
                                    <span
                                      className={cn(
                                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                                        isLive
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      )}
                                    >
                                      {isLive ? "Ao vivo" : "Gravada"}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                              Nenhum evento selecionado.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ) : activeTab === "duvidas" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Dúvidas</p>
                    <p className="text-sm text-muted-foreground">
                      {lessonDoubtsByClass.data?.length ?? 0} comentário
                      {lessonDoubtsByClass.data?.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {lessonDoubtsByClass.isLoading && (
                    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Carregando dúvidas...
                    </div>
                  )}

                  {lessonDoubtsByClass.isError && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      Erro ao carregar dúvidas.
                    </div>
                  )}

                  {replyError && (
                    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {replyError}
                    </div>
                  )}

                  {!lessonDoubtsByClass.isLoading &&
                    !lessonDoubtsByClass.isError &&
                    (!lessonDoubtsByClass.data || lessonDoubtsByClass.data.length === 0) && (
                      <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                        Nenhuma dúvida encontrada para esta turma.
                      </div>
                    )}

                  {!lessonDoubtsByClass.isLoading &&
                    !lessonDoubtsByClass.isError &&
                    lessonDoubtsByClass.data &&
                    lessonDoubtsByClass.data.length > 0 && (
                      <ul className="space-y-4">
                        {lessonDoubtsByClass.data.map((doubt) => {
                          const isAnswersOpen = Boolean(expandedDoubtAnswers[doubt.id]);
                          const isReplyOpen = openReplyDoubtId === doubt.id;
                          const replyText = replyByDoubt[doubt.id] ?? "";
                          const isReplySubmitting = Boolean(replySubmittingByDoubt[doubt.id]);

                          return (
                            <li
                              key={doubt.id}
                              className="rounded-2xl border border-border bg-background px-4 py-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
                                  {doubt.student_profile_pic ? (
                                    <img
                                      src={doubt.student_profile_pic}
                                      alt={doubt.student_full_name}
                                      className="h-11 w-11 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {doubt.student_full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(doubt.created_at).toLocaleString("pt-BR", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {doubt.lesson_name}
                                  </p>
                                  <p className="pt-1 text-sm text-foreground">{doubt.comment}</p>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleDoubtAnswers(doubt.id)}
                                  className="h-8 px-2 text-xs"
                                >
                                  {isAnswersOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  Ver respostas ({doubt.doubt_answers.length})
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleReplyInput(doubt.id)}
                                  className="h-auto px-0 py-0 text-xs text-primary hover:bg-transparent hover:underline"
                                >
                                  Responder
                                </Button>
                              </div>

                              {isAnswersOpen && (
                                <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-3">
                                  {doubt.doubt_answers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      Nenhuma resposta ainda.
                                    </p>
                                  ) : (
                                    doubt.doubt_answers.map((answer) => (
                                      <div key={answer.id} className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
                                          {answer.teacher_profile_pic ? (
                                            <img
                                              src={answer.teacher_profile_pic}
                                              alt={answer.teacher_name}
                                              className="h-9 w-9 rounded-full object-cover"
                                            />
                                          ) : (
                                            <User className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-foreground">
                                            {answer.teacher_name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(answer.created_at).toLocaleString("pt-BR", {
                                              dateStyle: "medium",
                                              timeStyle: "short",
                                            })}
                                          </p>
                                          <p className="pt-1 text-sm text-foreground">
                                            {answer.comment}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}

                              {isReplyOpen && (
                                <div className="mt-3 space-y-2">
                                  <textarea
                                    value={replyText}
                                    onChange={(event) =>
                                      handleReplyChange(doubt.id, event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Escreva uma resposta..."
                                    disabled={isReplySubmitting}
                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleSubmitReply(doubt.id)}
                                      disabled={isReplySubmitting}
                                    >
                                      {isReplySubmitting ? "Enviando..." : "Enviar resposta"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
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

      {isEventModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          onClick={handleCloseEventModal}
        >
          <div
            className="w-full max-w-3xl space-y-5 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Detalhes do evento</p>
                <h2 id="event-modal-title" className="text-xl font-semibold text-foreground">
                  {eventDetails.data?.lesson.name ?? "Evento"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseEventModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar modal"
              >
                X
              </button>
            </div>

            {eventDetails.isLoading && (
              <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                Carregando evento...
              </div>
            )}

            {eventDetails.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Erro ao carregar evento.
              </div>
            )}

            {!eventDetails.isLoading && !eventDetails.isError && eventDetails.data && (
              <>
                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {eventDetails.data.lesson.name}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                            eventDetails.data.lesson.lesson_type === "live"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {eventDetails.data.lesson.lesson_type === "live"
                            ? "Ao vivo"
                            : "Gravada"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {eventFieldsEditable.scheduled_datetime ? (
                          <Input
                            type="datetime-local"
                            value={eventScheduledDatetime}
                            onChange={(event) => setEventScheduledDatetime(event.target.value)}
                            className="h-10 rounded-2xl"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {new Date(eventDetails.data.scheduled_datetime).toLocaleString(
                              "pt-BR",
                              { dateStyle: "medium", timeStyle: "short" }
                            )}
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleEnableEventFieldEdit("scheduled_datetime")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="w-4/5 rounded-2xl border border-border bg-card p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Preview do conteúdo
                      </p>
                      {eventDetails.data.lesson.content ? (
                        <video
                          src={eventDetails.data.lesson.content}
                          controls
                          className="h-36 w-full rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-xl border border-border bg-muted text-xs text-muted-foreground">
                          Conteúdo não informado
                        </div>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={!eventDetails.data.lesson.support_material}
                        onClick={() => {
                          if (!eventDetails.data?.lesson.support_material) return;
                          window.open(eventDetails.data.lesson.support_material, "_blank");
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Material de suporte
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Link da gravação
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleEnableEventFieldEdit("event_recorded_link")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {eventFieldsEditable.event_recorded_link ? (
                      <Input
                        value={eventRecordedLink}
                        onChange={(event) => setEventRecordedLink(event.target.value)}
                        placeholder="https://"
                        className="h-10 rounded-2xl"
                      />
                    ) : eventDetails.data.event_recorded_link ? (
                      <a
                        href={eventDetails.data.event_recorded_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-foreground underline-offset-4 hover:underline"
                      >
                        {eventDetails.data.event_recorded_link}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Não informado</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Conteúdo extra
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleEnableEventFieldEdit("lesson_content")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {eventDetails.data.lesson_content ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!eventDetails.data?.lesson_content) return;
                            window.open(eventDetails.data.lesson_content, "_blank");
                          }}
                        >
                          Ver conteúdo
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleEnableEventFieldEdit("lesson_content");
                            lessonContentInputRef.current?.click();
                          }}
                        >
                          Enviar conteúdo extra
                        </Button>
                      )}
                      {eventFieldsEditable.lesson_content && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => lessonContentInputRef.current?.click()}
                        >
                          Selecionar arquivo
                        </Button>
                      )}
                      {eventLessonContentFile && (
                        <p className="text-xs text-muted-foreground">{eventLessonContentFile.name}</p>
                      )}
                      <input
                        ref={lessonContentInputRef}
                        type="file"
                        className="sr-only"
                        onChange={(event) =>
                          setEventLessonContentFile(event.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Aviso da aula
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleEnableEventFieldEdit("class_notice")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {eventFieldsEditable.class_notice ? (
                      <textarea
                        value={eventClassNotice}
                        onChange={(event) => setEventClassNotice(event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-sm text-foreground">
                        {eventDetails.data.class_notice || "Sem aviso para esta aula."}
                      </p>
                    )}
                  </div>
                </div>

                {eventSaveError && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {eventSaveError}
                  </div>
                )}

                {hasEventFieldEditingEnabled && (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancelEventEdit}
                      disabled={updateEvent.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveEventChanges}
                      disabled={updateEvent.isPending}
                    >
                      {updateEvent.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isDaysModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="days-modal-title"
          onClick={() => setIsDaysModalOpen(false)}
        >
          <div
            className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dias da semana</p>
                <h2 id="days-modal-title" className="text-xl font-semibold text-foreground">
                  Selecionar dias
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDaysModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar modal"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK_OPTIONS.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleToggleDay(day.value)}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                      isSelected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-accent/60"
                    )}
                    aria-pressed={isSelected}
                    title={day.label}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {selectedDays.length
                  ? `Selecionado: ${selectedDaysLabel}`
                  : "Nenhum dia selecionado"}
              </p>
              <Button type="button" onClick={() => setIsDaysModalOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}

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
