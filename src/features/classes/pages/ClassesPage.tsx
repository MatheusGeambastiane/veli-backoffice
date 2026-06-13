"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@/shared/components/ui/input";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/components/ui/label";
import { HttpError } from "@/shared/lib/http/http";
import {
  useClassesList,
  useCoursesSimpleOnDemand,
  useCreateClass,
  useTeacherProfilesSimpleOnDemand,
} from "@/features/classes/queries/classesQueries";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DAY_OPTIONS = [
  { label: "S", fullLabel: "Segunda-feira", value: "Mon" },
  { label: "T", fullLabel: "Terca-feira", value: "Tue" },
  { label: "Q", fullLabel: "Quarta-feira", value: "Wed" },
  { label: "Q", fullLabel: "Quinta-feira", value: "Thu" },
  { label: "S", fullLabel: "Sexta-feira", value: "Fri" },
  { label: "S", fullLabel: "Sabado", value: "Sat" },
  { label: "D", fullLabel: "Domingo", value: "Sun" },
] as const;
const WEEKDAY_LABELS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"] as const;
const WEEKDAY_DISPLAY_MAP: Record<string, string> = {
  Mon: "Seg",
  Tue: "Ter",
  Wed: "Qua",
  Thu: "Qui",
  Fri: "Sex",
  Sat: "Sab",
  Sun: "Dom",
};

export function ClassesPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [isGeneric, setIsGeneric] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const { status } = useSession();

  const { data, isLoading, isError, isFetching } = useClassesList({
    search: deferredSearch || undefined,
    is_active: activeFilter || undefined,
    page_size: pageSize,
  });
  const { data: courses, isLoading: isLoadingCourses } = useCoursesSimpleOnDemand(isCreateOpen);
  const { data: teachers, isLoading: isLoadingTeachers } =
    useTeacherProfilesSimpleOnDemand(isCreateOpen);
  const createClass = useCreateClass();
  const isAuthLoading = status === "loading";
  const showLoading = isAuthLoading || isLoading;
  const selectedCourse = courses?.find((item) => item.id === selectedCourseId) ?? null;
  const selectedTeacher = teachers?.find((item) => item.id === selectedTeacherId) ?? null;
  const createErrorMessage =
    createClass.error instanceof HttpError && createClass.error.details
      ? normalizeHttpError(createClass.error.details)
      : createClass.isError
        ? "Erro ao criar turma."
        : null;
  const isCreateDisabled =
    !selectedCourseId ||
    !selectedTeacherId ||
    !startDate ||
    !finishDate ||
    !time ||
    selectedDays.length === 0 ||
    !duration ||
    Number(duration) <= 0 ||
    createClass.isPending;

  const filterLabel = useMemo(() => {
    if (activeFilter === "true") return "Ativas";
    if (activeFilter === "false") return "Inativas";
    return "Todas";
  }, [activeFilter]);

  function resetCreateForm() {
    setSelectedCourseId("");
    setSelectedTeacherId("");
    setStartDate("");
    setFinishDate("");
    setTime("");
    setSelectedDays([]);
    setDuration("");
    setIsGeneric(false);
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    if (createClass.isPending) return;
    setIsCreateOpen(false);
    resetCreateForm();
    createClass.reset();
  }

  function handleDayToggle(day: string) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  }

  async function handleCreateClass() {
    if (isCreateDisabled) return;

    try {
      await createClass.mutateAsync({
        course: Number(selectedCourseId),
        teacher_profile: Number(selectedTeacherId),
        start_date: startDate,
        finish_date: finishDate,
        time: `${time}:00`,
        days_of_week: selectedDays,
        duration: Number(duration),
        is_generic: isGeneric,
      });
      handleCloseCreate();
    } catch {
      // handled by mutation state
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Turmas</h1>
            <p className="text-sm text-muted-foreground">
              {data?.count ?? 0} turma{data?.count === 1 ? "" : "s"} cadastrada
              {data?.count === 1 ? "" : "s"}
            </p>
          </div>
          <Button type="button" className="h-11 gap-2 self-start rounded-2xl" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Adicionar nova turma
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
              onClick={() => setIsFilterOpen((current) => !current)}
              aria-label="Filtrar turmas"
              aria-expanded={isFilterOpen}
              aria-haspopup="menu"
            >
              <Filter className="h-4 w-4" />
              {filterLabel}
            </Button>
            {isFilterOpen && (
              <div
                className="absolute left-0 top-12 z-20 w-48 rounded-2xl border border-border bg-card p-2 shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === ""
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("true");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === "true"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Ativas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("false");
                    setIsFilterOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeFilter === "false"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/60"
                  }`}
                  role="menuitem"
                >
                  Inativas
                </button>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-wide">Itens por página</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
              aria-label="Selecionar page size"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative w-full max-w-[80%]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar turma"
            className="h-11 rounded-2xl"
            aria-label="Buscar turma"
          />
        </div>
      </div>

      {showLoading && (
        <div className="rounded-3xl border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Carregando turmas...
        </div>
      )}

      {!showLoading && isError && (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 px-6 py-6 text-sm text-destructive">
          Erro ao carregar turmas.
        </div>
      )}

      {!showLoading && !isError && data && (
        <div className="space-y-4">
          {isFetching && (
            <p className="text-xs font-medium text-primary">Atualizando resultados...</p>
          )}
          {data?.results.length ? (
            <ul className="grid gap-4 lg:grid-cols-2">
              {data.results.map((item) => (
                <li
                  key={item.id}
                  className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.language_icon_url ? (
                        <img
                          src={item.language_icon_url}
                          alt={item.course_name}
                          className="h-12 w-12 rounded-2xl border border-border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl border border-border bg-muted" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.course_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Professor: {item.teacher_full_name ?? "Nao informado"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        item.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.is_active ? "Ativa" : "Inativa"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                        item.is_generic
                          ? "bg-sky-100 text-sky-800"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.is_generic ? "Genérica" : "Regular"}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Periodo</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.start_date} - {item.finish_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Horario</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.time} • {item.duration} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Dias</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatWeekdaysPt(item.days_of_week)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Alunos</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.total_students}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/classes/${item.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground">
              Nenhuma turma encontrada para os filtros atuais.
            </div>
          )}
        </div>
      )}

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-class-title"
          onClick={handleCloseCreate}
        >
          <div
            className="w-full max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nova turma</p>
                <h2 id="create-class-title" className="text-xl font-semibold text-foreground">
                  Adicionar nova turma
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Curso</Label>
                <SingleSelectDropdown
                  ariaLabel="Selecionar curso"
                  placeholder="Selecione o curso"
                  value={selectedCourseId}
                  options={(courses ?? []).map((course) => ({
                    value: course.id,
                    label: course.name,
                  }))}
                  isLoading={isLoadingCourses}
                  loadingLabel="Carregando cursos..."
                  onChange={setSelectedCourseId}
                />
              </div>

              <div className="space-y-2">
                <Label>Professor associado</Label>
                <SingleSelectDropdown
                  ariaLabel="Selecionar professor"
                  placeholder="Selecione o professor"
                  value={selectedTeacherId}
                  options={(teachers ?? []).map((teacher) => ({
                    value: teacher.id,
                    label: teacher.full_name,
                  }))}
                  isLoading={isLoadingTeachers}
                  loadingLabel="Carregando professores..."
                  onChange={setSelectedTeacherId}
                />
              </div>

              <div className="space-y-2">
                <Label>Data de inicio</Label>
                <DateField
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Selecione a data"
                  ariaLabel="Selecionar data de inicio"
                />
              </div>

              <div className="space-y-2">
                <Label>Data final</Label>
                <DateField
                  value={finishDate}
                  onChange={setFinishDate}
                  placeholder="Selecione a data"
                  ariaLabel="Selecionar data final"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-time">Horario</Label>
                <Input
                  id="class-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-duration">Duracao das aulas (minutos)</Label>
                <Input
                  id="class-duration"
                  type="number"
                  min="1"
                  step="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  placeholder="90"
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3 md:col-span-2">
                <div>
                  <Label htmlFor="class-is-generic">É uma turma genérica</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Marque quando esta turma deve ser tratada como genérica.
                  </p>
                </div>
                <button
                  id="class-is-generic"
                  type="button"
                  role="switch"
                  aria-checked={isGeneric}
                  onClick={() => setIsGeneric((current) => !current)}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors",
                    isGeneric ? "border-primary bg-primary" : "border-border bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                      isGeneric ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day, index) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={`${day.value}-${index}`}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={cn(
                        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                      aria-pressed={isSelected}
                      title={day.fullLabel}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resumo de criacao</p>
                <p className="text-base font-semibold text-foreground">
                  {selectedCourse?.name ?? "Curso nao selecionado"}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <p>
                  Professor:{" "}
                  <span className="font-medium text-foreground">
                    {selectedTeacher?.full_name ?? "-"}
                  </span>
                </p>
                <p>
                  Periodo:{" "}
                  <span className="font-medium text-foreground">
                    {formatDateDisplay(startDate) || "-"} ate {formatDateDisplay(finishDate) || "-"}
                  </span>
                </p>
                <p>
                  Horario: <span className="font-medium text-foreground">{time || "-"}</span>
                </p>
                <p>
                  Duracao:{" "}
                  <span className="font-medium text-foreground">
                    {duration ? `${duration} min` : "-"}
                  </span>
                </p>
                <p className="md:col-span-2">
                  Dias:{" "}
                  <span className="font-medium text-foreground">
                    {selectedDays.length ? formatWeekdaysPt(selectedDays) : "-"}
                  </span>
                </p>
                <p className="md:col-span-2">
                  Turma genérica:{" "}
                  <span className="font-medium text-foreground">{isGeneric ? "Sim" : "Nao"}</span>
                </p>
              </div>
            </div>

            {createErrorMessage && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {createErrorMessage}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={handleCloseCreate}
                disabled={createClass.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={handleCreateClass}
                disabled={isCreateDisabled}
              >
                {createClass.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function normalizeHttpError(details: unknown) {
  if (typeof details === "string") return details;

  if (details && typeof details === "object") {
    if ("detail" in details && typeof details.detail === "string") {
      return details.detail;
    }

    const values = Object.values(details)
      .flatMap((value) => {
        if (Array.isArray(value)) {
          return value.map(String);
        }
        if (typeof value === "string") {
          return [value];
        }
        return [];
      })
      .filter(Boolean);

    if (values.length) {
      return values.join(" ");
    }
  }

  return "Erro ao criar turma.";
}

function formatWeekdaysPt(days: string[]) {
  return days.map((day) => WEEKDAY_DISPLAY_MAP[day] ?? day).join(", ");
}

function formatDateDisplay(value: string) {
  if (!value) return "";
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString("pt-BR");
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (startWeekday + 6) % 7;
  const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingEmptyDays + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return new Date(year, month, dayNumber);
  });
}

function toDateValue(date: Date) {
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

function SingleSelectDropdown({
  value,
  options,
  placeholder,
  onChange,
  ariaLabel,
  isLoading,
  loadingLabel,
}: {
  value: number | "";
  options: { value: number; label: string }[];
  placeholder: string;
  onChange: (value: number | "") => void;
  ariaLabel: string;
  isLoading?: boolean;
  loadingLabel?: string;
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
        <div
          role="listbox"
          className="absolute left-0 top-12 z-30 w-full rounded-2xl border border-border bg-card p-2 shadow-lg"
        >
          {isLoading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {loadingLabel ?? "Carregando..."}
            </p>
          )}
          {!isLoading && options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma opcao encontrada.</p>
          )}
          {!isLoading && options.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-auto pr-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent"
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

function DateField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = value ? parseLocalDate(value) : null;
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = selectedDate ?? new Date();
    return { year: baseDate.getFullYear(), month: baseDate.getMonth() };
  });

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth({
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    });
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current || !event.target) return;
      if (!pickerRef.current.contains(event.target as Node)) {
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

  function handlePreviousMonth() {
    setVisibleMonth((current) => {
      if (current.month === 0) {
        return { year: current.year - 1, month: 11 };
      }
      return { year: current.year, month: current.month - 1 };
    });
  }

  function handleNextMonth() {
    setVisibleMonth((current) => {
      if (current.month === 11) {
        return { year: current.year + 1, month: 0 };
      }
      return { year: current.year, month: current.month + 1 };
    });
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 z-30 w-[320px] rounded-3xl border border-border bg-card p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-8 w-8 rounded-full p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold capitalize text-foreground">
              {formatMonthLabel(visibleMonth.year, visibleMonth.month)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-full p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {WEEKDAY_LABELS_PT.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {buildCalendarDays(visibleMonth.year, visibleMonth.month).map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${visibleMonth.year}-${visibleMonth.month}-${index}`}
                    className="flex h-11 items-center justify-center rounded-2xl bg-muted/20"
                  />
                );
              }

              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={toDateValue(date)}
                  type="button"
                  onClick={() => {
                    onChange(toDateValue(date));
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-2xl text-sm transition-colors hover:bg-accent",
                    isToday && !isSelected && "text-primary",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
