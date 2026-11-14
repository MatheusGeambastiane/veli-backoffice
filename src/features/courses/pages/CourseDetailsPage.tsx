"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FolderPlus, Layers, Library, Plus, Trash2, X } from "lucide-react";
import { CourseLevelsPicker } from "@/features/courses/components/CourseLevelsPicker";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  useCourseDetails,
  useAddCourseModule,
  useAvailableCourseModules,
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
  const addModule = useAddCourseModule(courseId);
  const moduleDialogRef = useRef<HTMLDialogElement>(null);
  const updateCourse = useUpdateCourse(courseId);
  const updateModuleOrder = useUpdateModuleOrder();
  const { data: languages } = useLanguagesSimple();
  const { data: languageLevels, isLoading: isLoadingLevels, isError: isLevelsError } = useLanguageLevels();
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleMode, setModuleMode] = useState<'new' | 'existing' | null>(null);
  const [existingModuleId, setExistingModuleId] = useState<number | ''>('');
  const availableModules = useAvailableCourseModules(isModuleModalOpen && moduleMode === 'existing');
  const [moduleName, setModuleName] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number | "">("");
  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | "">("");
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [modulesState, setModulesState] = useState<CourseModule[]>([]);
  const [draggedModuleId, setDraggedModuleId] = useState<number | null>(null);
  const [overModuleId, setOverModuleId] = useState<number | null>(null);

  const selectableModules = (availableModules.data ?? []).filter(
    (module) => !data?.modules.some((linked) => linked.id === module.id)
  );

  useEffect(() => {
    if (isModuleModalOpen) moduleDialogRef.current?.showModal();
    else moduleDialogRef.current?.close();
  }, [isModuleModalOpen]);

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
    if (!selectedLanguageId) return [];
    return levels.filter((level) => level.language === selectedLanguageId);
  }, [languageLevels, selectedLanguageId]);

  const isSaveDisabled =
    !courseName.trim() || !selectedLanguageId || !selectedLevelIds.length || isLoadingLevels || isLevelsError || updateCourse.isPending;

  useEffect(() => {
    if (!data || isEditing) return;
    setCourseName(data.name ?? "");
    setCourseDescription(data.description ?? "");
    setSelectedLanguageId(data.language);
    setSelectedLevelIds(data.levels ?? (data.level ? [data.level] : []));
    const sortedModules = [...data.modules].sort((a, b) => a.order - b.order);
    setModulesState(sortedModules);
  }, [data, isEditing]);

  function openModuleModal() {
    addModule.reset();
    setModuleMode(null);
    setExistingModuleId("");
    setModuleOrder(nextModuleOrder);
    setIsModuleModalOpen(true);
  }

  function closeModuleModal() {
    if (addModule.isPending) return;
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
    setSelectedLevelIds(data.levels ?? (data.level ? [data.level] : []));
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
    if (!courseName.trim() || !selectedLanguageId || !selectedLevelIds.length || isLoadingLevels || isLevelsError) return;
    const modulesIds = modulesState.map((module) => module.id);
    try {
      await updateCourse.mutateAsync({
        name: courseName.trim(),
        language: Number(selectedLanguageId),
        levels: selectedLevelIds,
        description: courseDescription.trim(),
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

  async function handleAddModule() {
    if (addModule.isPending || !moduleMode) return;
    if (moduleMode === 'new' && (!moduleName.trim() || !Number.isInteger(moduleOrder) || Number(moduleOrder) < 1)) return;
    if (moduleMode === 'existing' && !existingModuleId) return;
    try {
      const addedModule = await addModule.mutateAsync(moduleMode === 'existing'
        ? { module: Number(existingModuleId) }
        : { name: moduleName.trim(), order: Number(moduleOrder) });
      setModulesState((current) => [...current.filter((item) => item.id !== addedModule.id), addedModule].sort((a, b) => a.order - b.order));
      setIsModuleModalOpen(false);
      resetModuleForm();
    } catch {
      // Keep the form open; the mutation error is displayed below.
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
                            setSelectedLevelIds([]);
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
                        <CourseLevelsPicker
                          levels={filteredLevels}
                          selectedIds={selectedLevelIds}
                          onChange={setSelectedLevelIds}
                          hasLanguage={Boolean(selectedLanguageId)}
                          isLoading={isLoadingLevels}
                          isError={isLevelsError}
                          disabled={updateCourse.isPending}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {(data.level_names ?? (data.level_name ? [data.level_name] : [])).map((name) => (
                          <span key={name} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{name}</span>
                        ))}
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

      <dialog
        ref={moduleDialogRef}
        aria-labelledby="create-module-title"
        className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-background/80 backdrop:backdrop-blur-sm"
        onCancel={(event) => { event.preventDefault(); closeModuleModal(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeModuleModal(); }}
      >
        <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); void handleAddModule(); }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 id="create-module-title" className="text-xl font-semibold">
                {moduleMode === 'new' ? 'Criar um novo módulo' : moduleMode === 'existing' ? 'Usar um módulo existente' : 'Adicionar módulo'}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {moduleMode === 'new' ? 'O novo módulo será associado automaticamente a este curso.' : moduleMode === 'existing' ? 'Selecione um módulo para incluir neste curso.' : 'Como você deseja adicionar conteúdo ao curso?'}
              </p>
            </div>
            <Button type="button" variant="outline" className="h-9 w-9 shrink-0 p-0" aria-label="Fechar modal" disabled={addModule.isPending} onClick={closeModuleModal}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {moduleMode === null && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setModuleMode('new')} className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FolderPlus className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="space-y-2">
                  <span className="block text-base font-semibold">Criar um novo módulo</span>
                  <span className="block text-sm leading-relaxed text-muted-foreground">Comece um módulo do zero e adicione suas aulas.</span>
                </span>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary">Criar módulo <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </button>
              <button type="button" onClick={() => setModuleMode('existing')} className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Library className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="space-y-2">
                  <span className="block text-base font-semibold">Usar um módulo existente</span>
                  <span className="block text-sm leading-relaxed text-muted-foreground">Reaproveite um módulo e as aulas já cadastradas.</span>
                </span>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary">Escolher módulo <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </button>
            </div>
          )}
          {moduleMode === 'new' && (
            <fieldset className="grid gap-4" disabled={addModule.isPending}>
              <div className="space-y-2">
                <label htmlFor="module-name" className="text-sm font-medium">Nome</label>
                <Input id="module-name" required maxLength={255} value={moduleName} onChange={(event) => setModuleName(event.target.value)} placeholder="Nome do módulo" />
              </div>
              <div className="space-y-2">
                <label htmlFor="module-order" className="text-sm font-medium">Ordem de exibição</label>
                <Input id="module-order" required type="number" min={1} step={1} value={moduleOrder} onChange={(event) => setModuleOrder(event.target.value ? Number(event.target.value) : '')} />
              </div>
            </fieldset>
          )}
          {moduleMode === 'existing' && (
            <div className="space-y-3">
              {availableModules.isPending ? <p role="status">Carregando módulos...</p> : availableModules.isError ? (
                <div role="alert" className="text-sm text-destructive">
                  Não foi possível carregar os módulos.
                  <Button type="button" variant="outline" onClick={() => void availableModules.refetch()}>Tentar novamente</Button>
                </div>
              ) : selectableModules.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum módulo disponível para associar. Crie um novo módulo.</p> : (
                <>
                  <label htmlFor="existing-module" className="text-sm font-medium">Módulo existente</label>
                  <select id="existing-module" required value={existingModuleId} disabled={addModule.isPending} onChange={(event) => setExistingModuleId(event.target.value ? Number(event.target.value) : '')} className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
                    <option value="">Selecione um módulo</option>
                    {selectableModules.map((module) => <option key={module.id} value={module.id}>{module.name} — Ordem {module.order}</option>)}
                  </select>
                  <p className="text-sm text-muted-foreground">O módulo e suas aulas serão compartilhados entre os cursos associados.</p>
                </>
              )}
            </div>
          )}
          {addModule.isError && <p role="alert" className="text-sm text-destructive">Não foi possível adicionar o módulo ao curso. Tente novamente.</p>}
          {moduleMode !== null && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" disabled={addModule.isPending} onClick={() => { setModuleMode(null); addModule.reset(); }}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
              </Button>
              <Button type="submit" disabled={addModule.isPending || (moduleMode === 'new' ? !moduleName.trim() || !Number.isInteger(moduleOrder) || Number(moduleOrder) < 1 : !existingModuleId || availableModules.isError || availableModules.isPending)}>
                {addModule.isPending ? 'Salvando...' : moduleMode === 'new' ? 'Criar e associar' : 'Associar módulo'}
              </Button>
            </div>
          )}
        </form>
      </dialog>
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
