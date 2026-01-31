"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, LayoutGrid, List, Plus, Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  useCoursesList,
  useCreateCourse,
  useLanguageLevels,
  useLanguagesSimple,
  useModulesList,
} from "@/features/courses/queries/coursesQueries";
import type { Course, SimpleLanguage } from "@/features/courses/types/course";

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

function parsePageFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const page = parsed.searchParams.get("page");
    return page ? Number(page) : null;
  } catch {
    return null;
  }
}

export function CoursesPage() {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | "">("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | "">("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const deferredSearch = useDeferredValue(search.trim());

  const { data: languages, isLoading: isLoadingLanguages } = useLanguagesSimple();
  const { data: languageLevels, isLoading: isLoadingLevels } = useLanguageLevels();
  const { data: modulesData, isLoading: isLoadingModules } = useModulesList();
  const {
    data,
    isLoading: isLoadingCourses,
    isError,
    isFetching,
  } = useCoursesList({
    search: deferredSearch ? deferredSearch : undefined,
    pageSize,
    page,
    languageIds: selectedLanguageIds.length ? selectedLanguageIds : undefined,
  });
  const createCourse = useCreateCourse();

  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const nextPageFromApi = parsePageFromUrl(data?.next ?? null);
  const previousPageFromApi = parsePageFromUrl(data?.previous ?? null);
  const canGoPrevious = previousPageFromApi !== null || page > 1;
  const canGoNext = nextPageFromApi !== null || page < totalPages;
  const courses = data?.results ?? [];

  const languageMap = useMemo(() => {
    const map = new Map<number, SimpleLanguage>();
    (languages ?? []).forEach((language) => map.set(language.id, language));
    return map;
  }, [languages]);

  const filteredLevels = useMemo(() => {
    const levels = languageLevels?.results ?? [];
    if (!selectedLanguageId) return levels;
    return levels.filter((level) => level.language === selectedLanguageId);
  }, [languageLevels, selectedLanguageId]);

  const modulesList = modulesData?.results ?? [];

  const isCreateDisabled =
    !courseName.trim() ||
    !selectedLanguageId ||
    !selectedLevelId ||
    createCourse.isPending;

  function handleModuleToggle(moduleId: number) {
    setSelectedModuleIds((current) =>
      current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]
    );
  }

  function handleOpenCreate() {
    setIsCreateOpen(true);
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
    resetCreateForm();
  }

  function resetCreateForm() {
    setCourseName("");
    setCourseDescription("");
    setSelectedLanguageId("");
    setSelectedLevelId("");
    setSelectedModuleIds([]);
  }

  async function handleCreateCourse() {
    if (isCreateDisabled) return;
    try {
      await createCourse.mutateAsync({
        name: courseName.trim(),
        language: Number(selectedLanguageId),
        level: Number(selectedLevelId),
        description: courseDescription.trim() ? courseDescription.trim() : null,
        is_active: true,
        modules: selectedModuleIds,
      });
      handleCloseCreate();
    } catch {
      // handled by mutation state
    }
  }

  const selectedLanguageLabels = useMemo(() => {
    if (!selectedLanguageIds.length) return "Todos idiomas";
    const labels = selectedLanguageIds
      .map((id) => languageMap.get(id)?.name)
      .filter(Boolean) as string[];
    if (labels.length === 0) {
      return `${selectedLanguageIds.length} idiomas`;
    }
    return labels.length <= 2 ? labels.join(", ") : `${labels.length} idiomas`;
  }, [languageMap, selectedLanguageIds]);

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  function handleLanguageToggle(id: number) {
    setSelectedLanguageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    setPage(1);
  }

  function clearLanguages() {
    setSelectedLanguageIds([]);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!canGoPrevious) return;
    setPage((current) => Math.max(1, previousPageFromApi ?? current - 1));
  }

  function goToNextPage() {
    if (!canGoNext) return;
    setPage((current) => Math.min(totalPages, nextPageFromApi ?? current + 1));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Catalogo de cursos</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Cursos</h1>
          <p className="text-sm text-muted-foreground">Busque, filtre e acompanhe os cursos ativos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="h-10 rounded-2xl" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            Adicionar novo curso
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="h-10 rounded-2xl"
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className="h-10 rounded-2xl"
          >
            <LayoutGrid className="h-4 w-4" />
            Blocos
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou descricao"
            className="h-11 rounded-2xl border-border bg-card pl-9 shadow-sm"
            aria-label="Buscar cursos"
          />
        </div>
        <LanguagesDropdown
          isLoading={isLoadingLanguages}
          languages={languages ?? []}
          selectedIds={selectedLanguageIds}
          label={selectedLanguageLabels}
          onToggle={handleLanguageToggle}
          onClear={clearLanguages}
        />
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <span className="text-xs uppercase tracking-wide">Page size</span>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(Number(event.target.value))}
            className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            aria-label="Selecionar tamanho da pagina"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CoursesPagination
        page={page}
        totalPages={totalPages}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={goToNextPage}
        onPrevious={goToPreviousPage}
        isFetching={isFetching}
      />

      {isLoadingCourses && (
        <div className="space-y-3 rounded-3xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-border bg-card px-5 py-6 text-sm text-destructive shadow-sm">
          Erro ao carregar cursos.
        </div>
      )}

      {!isLoadingCourses && !isError && courses.length === 0 && (
        <div className="rounded-3xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum curso encontrado para os filtros atuais.
        </div>
      )}

      {!isLoadingCourses && !isError && courses.length > 0 && (
        <>
          {viewMode === "list" ? (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-border/80 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                <span>Curso</span>
                <span>Idioma</span>
                <span className="text-right">Ativo</span>
              </div>
              <ul className="divide-y divide-border/80">
                {courses.map((course) => (
                  <CourseRow key={course.id} course={course} languageMap={languageMap} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} languageMap={languageMap} />
              ))}
            </div>
          )}
        </>
      )}

      <CoursesPagination
        page={page}
        totalPages={totalPages}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={goToNextPage}
        onPrevious={goToPreviousPage}
        isFetching={isFetching}
      />

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-course-title"
          onClick={handleCloseCreate}
        >
          <div
            className="w-full max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novo curso</p>
                <h2 id="create-course-title" className="text-xl font-semibold text-foreground">
                  Adicionar novo curso
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

            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  placeholder="Nome do curso"
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descricao</label>
                <textarea
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
                  placeholder="Descricao do curso"
                  className="min-h-[96px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Idioma</label>
                  <select
                    value={selectedLanguageId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedLanguageId(value ? Number(value) : "");
                      setSelectedLevelId("");
                    }}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Selecione o idioma</option>
                    {isLoadingLanguages && <option>Carregando...</option>}
                    {!isLoadingLanguages &&
                      (languages ?? []).map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nivel</label>
                  <select
                    value={selectedLevelId}
                    onChange={(event) =>
                      setSelectedLevelId(event.target.value ? Number(event.target.value) : "")
                    }
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={!selectedLanguageId}
                  >
                    <option value="">
                      {selectedLanguageId ? "Selecione o nivel" : "Selecione um idioma"}
                    </option>
                    {isLoadingLevels && <option>Carregando...</option>}
                    {!isLoadingLevels &&
                      filteredLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.level}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <fieldset className="rounded-2xl border border-border bg-background px-4 py-4">
              <legend className="text-sm font-semibold text-foreground">Modulos do curso</legend>
              <div className="mt-3 space-y-2">
                {isLoadingModules && (
                  <p className="text-sm text-muted-foreground">Carregando modulos...</p>
                )}
                {!isLoadingModules && modulesList.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum modulo encontrado.</p>
                )}
                {!isLoadingModules &&
                  modulesList.map((module) => (
                    <label
                      key={module.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModuleIds.includes(module.id)}
                        onChange={() => handleModuleToggle(module.id)}
                      />
                      <span className="flex-1 truncate">{module.name}</span>
                      <span className="text-xs text-muted-foreground">Ordem {module.order}</span>
                    </label>
                  ))}
              </div>
            </fieldset>

            {createCourse.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                Erro ao criar curso. Tente novamente.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseCreate}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreateCourse} disabled={isCreateDisabled}>
                {createCourse.isPending ? "Salvando..." : "Criar curso"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LanguagesDropdown({
  languages,
  selectedIds,
  label,
  onToggle,
  onClear,
  isLoading,
}: {
  languages: SimpleLanguage[];
  selectedIds: number[];
  label: string;
  onToggle: (id: number) => void;
  onClear: () => void;
  isLoading: boolean;
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
        className="inline-flex h-11 min-w-[220px] items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-12 z-20 w-[280px] rounded-2xl border border-border bg-card p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Idiomas
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-primary"
              disabled={selectedIds.length === 0}
            >
              Limpar
            </button>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && languages.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum idioma encontrado.</p>
          )}
          {!isLoading && languages.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {languages.map((language) => (
                <label
                  key={language.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(language.id)}
                    onChange={() => onToggle(language.id)}
                  />
                  {language.lang_icon ? (
                    <img
                      src={language.lang_icon}
                      alt={language.name}
                      className="h-6 w-6 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[10px] font-semibold">
                      {language.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate">{language.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoursesPagination({
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  isFetching,
}: {
  page: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isFetching: boolean;
}) {
  const safePage = Math.min(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Pagina {safePage} de {totalPages}
        {isFetching && <span className="ml-2 text-xs text-primary">Atualizando...</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <div className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">
          {safePage}/{totalPages}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proxima
        </button>
      </div>
    </div>
  );
}

function CourseRow({
  course,
  languageMap,
}: {
  course: Course;
  languageMap: Map<number, SimpleLanguage>;
}) {
  const language = languageMap.get(course.language);
  return (
    <li>
      <Link
        href={`/courses/${course.id}`}
        className="block px-4 py-4 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
      >
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{course.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {course.description || "Sem descricao"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {language?.lang_icon ? (
              <img
                src={language.lang_icon}
                alt={language.name}
                className="h-6 w-6 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[10px] font-semibold">
                {language?.name?.charAt(0).toUpperCase() ?? "I"}
              </span>
            )}
            <span className="truncate">{language?.name ?? `Idioma ${course.language}`}</span>
          </div>
          <div className="flex justify-end">
            {course.is_active ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Inativo</span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function CourseCard({
  course,
  languageMap,
}: {
  course: Course;
  languageMap: Map<number, SimpleLanguage>;
}) {
  const language = languageMap.get(course.language);
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-36 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {language?.lang_icon && (
          <img
            src={language.lang_icon}
            alt={language.name}
            className="absolute right-4 top-4 h-14 w-14 rounded-full border border-border bg-background object-cover"
          />
        )}
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{course.name}</p>
            <p className="text-sm text-muted-foreground">
              {language?.name ?? `Idioma ${course.language}`}
            </p>
          </div>
          {course.is_active && (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{course.description || "Sem descricao"}</p>
      </div>
    </Link>
  );
}
