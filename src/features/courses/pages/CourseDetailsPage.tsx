"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Layers, Plus, Trash2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  useCourseDetails,
  useCreateModule,
  useLanguageLevels,
  useLanguagesSimple,
  useUpdateCourse,
  useUpdateModuleOrder,
} from "@/features/courses/queries/coursesQueries";
import { cn } from "@/shared/lib/utils";
import type { CourseModule, SimpleLanguage } from "@/features/courses/types/course";

type CourseDetailsPageProps = {
  courseId: string;
};

export function CourseDetailsPage({ courseId }: CourseDetailsPageProps) {
  const { data, isLoading, isError, refetch } = useCourseDetails(courseId);
  const createModule = useCreateModule();
  const updateCourse = useUpdateCourse(courseId);
  const updateModuleOrder = useUpdateModuleOrder();
  const { data: languages } = useLanguagesSimple();
  const { data: languageLevels } = useLanguageLevels();
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number | "">("");
  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | "">("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | "">("");
  const [modulesState, setModulesState] = useState<CourseModule[]>([]);
  const [draggedModuleId, setDraggedModuleId] = useState<number | null>(null);
  const [overModuleId, setOverModuleId] = useState<number | null>(null);

  const languageMap = useMemo(() => {
    const map = new Map<number, SimpleLanguage>();
    (languages ?? []).forEach((language) => map.set(language.id, language));
    return map;
  }, [languages]);

  const nextModuleOrder = useMemo(() => {
    const source = modulesState.length ? modulesState : data?.modules ?? [];
    const orders = source.map((module) => module.order);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    return maxOrder + 1;
  }, [data?.modules, modulesState]);

  const filteredLevels = useMemo(() => {
    const levels = languageLevels?.results ?? [];
    if (!selectedLanguageId) return levels;
    return levels.filter((level) => level.language === selectedLanguageId);
  }, [languageLevels, selectedLanguageId]);

  const isSaveDisabled =
    !courseName.trim() || !selectedLanguageId || !selectedLevelId || updateCourse.isPending;

  useEffect(() => {
    if (!data || isEditing) return;
    setCourseName(data.name ?? "");
    setCourseDescription(data.description ?? "");
    setSelectedLanguageId(data.language);
    setSelectedLevelId(data.level);
    const sortedModules = [...data.modules].sort((a, b) => a.order - b.order);
    setModulesState(sortedModules);
  }, [data, isEditing]);

  function openModuleModal() {
    setModuleOrder(nextModuleOrder);
    setIsModuleModalOpen(true);
  }

  function closeModuleModal() {
    setIsModuleModalOpen(false);
    resetModuleForm();
  }

  function resetModuleForm() {
    setModuleName("");
    setModuleOrder("");
  }

  function resetEditForm() {
    if (!data) return;
    setCourseName(data.name ?? "");
    setCourseDescription(data.description ?? "");
    setSelectedLanguageId(data.language);
    setSelectedLevelId(data.level);
    const sortedModules = [...data.modules].sort((a, b) => a.order - b.order);
    setModulesState(sortedModules);
  }

  function handleRemoveModule(moduleId: number) {
    setModulesState((current) => {
      const next = current.filter((item) => item.id !== moduleId);
      return next.map((item, index) => ({ ...item, order: index + 1 }));
    });
  }

  function reorderModules(activeId: number, overId: number) {
    setModulesState((current) => {
      const activeIndex = current.findIndex((item) => item.id === activeId);
      const overIndex = current.findIndex((item) => item.id === overId);
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return current;
      const updated = [...current];
      const [moved] = updated.splice(activeIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated.map((item, index) => ({ ...item, order: index + 1 }));
    });
  }

  async function handleSaveChanges() {
    if (!data || updateCourse.isPending) return;
    if (!courseName.trim() || !selectedLanguageId || !selectedLevelId) return;
    const modulesIds = modulesState.map((module) => module.id);
    try {
      await updateCourse.mutateAsync({
        name: courseName.trim(),
        language: Number(selectedLanguageId),
        level: Number(selectedLevelId),
        description: courseDescription.trim() ? courseDescription.trim() : null,
        is_active: data.is_active ?? true,
        modules: modulesIds,
      });

      const originalOrders = new Map<number, number>(
        data.modules.map((module) => [module.id, module.order])
      );
      const updates = modulesState.filter(
        (module) => originalOrders.get(module.id) !== module.order
      );
      if (updates.length > 0) {
        await Promise.all(
          updates.map((module) =>
            updateModuleOrder.mutateAsync({ id: module.id, data: { order: module.order } })
          )
        );
      }

      setIsEditing(false);
      await refetch();
    } catch {
      // handled by mutation state
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    resetEditForm();
  }

  async function handleCreateModule() {
    if (!moduleName.trim() || !moduleOrder || createModule.isPending) return;
    try {
      await createModule.mutateAsync({
        name: moduleName.trim(),
        order: Number(moduleOrder),
      });
      await refetch();
      closeModuleModal();
    } catch {
      // handled by mutation state
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/courses"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para cursos
        </Link>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Detalhes do curso</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {data?.name ?? "Curso"}
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3 rounded-3xl border border-border bg-card px-5 py-6 shadow-sm">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-border bg-card px-5 py-6 text-sm text-destructive shadow-sm">
          Erro ao carregar o curso.
        </div>
      )}

      {data && !isLoading && !isError && (
        <>
          <fieldset className="rounded-3xl border border-border bg-card shadow-sm">
            <legend className="sr-only">Informacoes do curso</legend>
            <div className="flex flex-col gap-4 border-b border-border px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <LanguageIcon
                    src={
                      selectedLanguageId
                        ? languageMap.get(Number(selectedLanguageId))?.lang_icon ?? null
                        : data.language_icon
                    }
                    label={
                      selectedLanguageId
                        ? languageMap.get(Number(selectedLanguageId))?.name ?? data.language_name
                        : data.language_name
                    }
                  />
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {isEditing ? (
                        <Input
                          value={courseName}
                          onChange={(event) => setCourseName(event.target.value)}
                          className="h-10 min-w-[240px] rounded-2xl"
                        />
                      ) : (
                        <h2 className="text-xl font-semibold text-foreground">{data.name}</h2>
                      )}
                      {data.is_active && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Ativo
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          value={selectedLanguageId}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSelectedLanguageId(value ? Number(value) : "");
                            setSelectedLevelId("");
                          }}
                          className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Selecione o idioma</option>
                          {(languages ?? []).map((language) => (
                            <option key={language.id} value={language.id}>
                              {language.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedLevelId}
                          onChange={(event) =>
                            setSelectedLevelId(event.target.value ? Number(event.target.value) : "")
                          }
                          className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={!selectedLanguageId}
                        >
                          <option value="">
                            {selectedLanguageId ? "Selecione o nivel" : "Selecione um idioma"}
                          </option>
                          {filteredLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.level}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {data.level_name}
                        </span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {data.language_name}
                        </span>
                      </div>
                    )}
                    {isEditing ? (
                      <textarea
                        value={courseDescription}
                        onChange={(event) => setCourseDescription(event.target.value)}
                        className="min-h-[84px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Descricao do curso"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {data.description || "Sem descricao"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={isSaveDisabled}
                      >
                        {updateCourse.isPending ? "Salvando..." : "Salvar alteracoes"}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                      Editar curso
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <InfoCard label="Total de alunos" value={data.subscriptions_total} />
              <InfoCard label="Total de turmas" value={data.student_classes_total} />
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-border bg-card shadow-sm">
            <legend className="sr-only">Modulos do curso</legend>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conteudo programatico</p>
                <h2 className="text-lg font-semibold text-foreground">Modulos</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  {data.modules.length} {data.modules.length === 1 ? "modulo" : "modulos"}
                </div>
                <Button type="button" variant="outline" className="h-9" onClick={openModuleModal}>
                  <Plus className="h-4 w-4" />
                  Adicionar modulo
                </Button>
              </div>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-3">
              {modulesState.length === 0 && (
                <div className="rounded-2xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Nenhum modulo cadastrado.
                </div>
              )}
              {modulesState.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isEditing={isEditing}
                  isDragging={draggedModuleId === module.id}
                  isOver={overModuleId === module.id}
                  onRemove={() => handleRemoveModule(module.id)}
                  onDragStart={() => {
                    setDraggedModuleId(module.id);
                    setOverModuleId(module.id);
                  }}
                  onDragOver={() => {
                    if (draggedModuleId && draggedModuleId !== module.id) {
                      setOverModuleId(module.id);
                      reorderModules(draggedModuleId, module.id);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedModuleId(null);
                    setOverModuleId(null);
                  }}
                />
              ))}
            </div>
          </fieldset>
        </>
      )}

      {isModuleModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-module-title"
          onClick={closeModuleModal}
        >
          <div
            className="w-full max-w-lg space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novo modulo</p>
                <h2 id="create-module-title" className="text-xl font-semibold text-foreground">
                  Adicionar modulo
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModuleModal}
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
                  value={moduleName}
                  onChange={(event) => setModuleName(event.target.value)}
                  placeholder="Nome do modulo"
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ordem de exibicao</label>
                <Input
                  type="number"
                  min={1}
                  value={moduleOrder}
                  onChange={(event) =>
                    setModuleOrder(event.target.value ? Number(event.target.value) : "")
                  }
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>

            {createModule.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                Erro ao criar modulo. Tente novamente.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeModuleModal}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateModule}
                disabled={!moduleName.trim() || !moduleOrder || createModule.isPending}
              >
                {createModule.isPending ? "Salvando..." : "Criar modulo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LanguageIcon({ src, label }: { src: string | null; label: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className="h-16 w-16 rounded-2xl border border-border bg-background object-cover"
      />
    );
  }

  const initial = label.charAt(0).toUpperCase();
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted text-lg font-semibold text-muted-foreground">
      {initial || "I"}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ModuleCard({
  module,
  isEditing,
  isDragging,
  isOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  module: CourseModule;
  isEditing: boolean;
  isDragging: boolean;
  isOver: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}) {
  const cardClassName = cn(
    "group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-200 ease-out",
    isEditing && "cursor-move",
    isDragging && "scale-[1.02] opacity-60 shadow-lg ring-2 ring-primary/30",
    !isDragging && isOver && "scale-[1.01] border-primary/40 bg-accent/30 shadow-md"
  );

  const content = (
    <>
      <div className="relative h-20 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {module.image && (
          <img src={module.image} alt={module.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{module.name}</p>
            <p className="text-sm text-muted-foreground">Ordem {module.order}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {module.lessons_total} {module.lessons_total === 1 ? "aula" : "aulas"}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Remover modulo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (!isEditing) {
    return (
      <Link
        href={`/courses/modules/${module.id}`}
        className={cn(cardClassName, "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cardClassName}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDragEnd={onDragEnd}
    >
      {content}
    </div>
  );
}
