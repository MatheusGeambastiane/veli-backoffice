"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Film, Pencil, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  useExercisesSimpleList,
  useLessonDetails,
  useModuleDetails,
  useModuleLessons,
  useUpdateLesson,
} from "@/features/courses/queries/coursesQueries";
import type { Lesson } from "@/features/courses/types/course";

type LessonDetailsPageProps = {
  moduleId: string;
  lessonId: string;
};

export function LessonDetailsPage({ moduleId, lessonId }: LessonDetailsPageProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLessonName, setEditLessonName] = useState("");
  const [editExerciseId, setEditExerciseId] = useState<number | "">("");
  const [editContentFile, setEditContentFile] = useState<File | null>(null);
  const [editContentPreview, setEditContentPreview] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [isLiveContentOpen, setIsLiveContentOpen] = useState(false);
  const [isSupportExpanded, setIsSupportExpanded] = useState(false);
  const editContentInputRef = useRef<HTMLInputElement | null>(null);

  const { data: moduleData } = useModuleDetails(moduleId);
  const { data: lessons = [], isFetching } = useModuleLessons(moduleId, {});
  const { data: lessonDetails, isLoading } = useLessonDetails(lessonId);
  const { data: exercisesSimple = [] } = useExercisesSimpleList(isEditMode);
  const updateLesson = useUpdateLesson(lessonId);

  const sortedLessons = useMemo(
    () => [...lessons].sort((first, second) => first.order - second.order),
    [lessons]
  );

  useEffect(() => {
    if (!lessonDetails) return;
    setEditLessonName(lessonDetails.name);
    setEditExerciseId(lessonDetails.exercise?.id ?? "");
    setEditContentFile(null);
    setEditContentPreview(null);
  }, [lessonDetails]);

  useEffect(() => {
    if (editContentFile) {
      const url = URL.createObjectURL(editContentFile);
      setEditContentPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setEditContentPreview(null);
    return undefined;
  }, [editContentFile]);

  useEffect(() => {
    setIsEditMode(false);
    setPdfPage(1);
    setIsLiveContentOpen(false);
    setIsSupportExpanded(false);
  }, [lessonId]);

  const lessonTypeLabel =
    lessonDetails?.lesson_type === "asynchronous" ? "Assincrono" : "Ao vivo";

  const isLiveLesson = lessonDetails?.lesson_type === "live";
  const isAsyncLesson = lessonDetails?.lesson_type === "asynchronous";

  async function handleSaveChanges() {
    if (!lessonDetails || updateLesson.isPending) return;
    const formData = new FormData();
    if (editLessonName.trim()) {
      formData.append("name", editLessonName.trim());
    }
    formData.append(
      "exercise",
      editExerciseId === "" ? "null" : String(editExerciseId)
    );
    if (editContentFile) {
      formData.append("content", editContentFile);
    }

    try {
      await updateLesson.mutateAsync(formData);
      setIsEditMode(false);
    } catch {
      // handled by mutation state
    }
  }

  return (
    <section className="space-y-6 px-1 sm:px-1">
      <div className="flex flex-col gap-3">
        <Link
          href={`/courses/modules/${moduleId}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para modulo
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {moduleData?.name ?? "Modulo"}
            </p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {lessonDetails?.name ?? "Detalhes da aula"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isEditMode ? "ghost" : "default"}
              onClick={() => setIsEditMode((current) => !current)}
              className="gap-2"
              disabled={!lessonDetails}
            >
              <Pencil className="h-4 w-4" />
              {isEditMode ? "Cancelar edicao" : "Editar aula"}
            </Button>
            {isEditMode && (
              <Button
                type="button"
                onClick={handleSaveChanges}
                disabled={updateLesson.isPending || !lessonDetails}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateLesson.isPending ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_320px]">
        <div className="space-y-6">
          <fieldset className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <legend className="sr-only">Conteudo da aula</legend>
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {lessonDetails ? lessonTypeLabel : "-"}
                </span>
                {lessonDetails && (
                  <span className="text-xs text-muted-foreground">
                    Ordem {lessonDetails.order}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nome da aula
                </p>
                {isEditMode ? (
                  <Input
                    value={editLessonName}
                    onChange={(event) => setEditLessonName(event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Nome da aula"
                  />
                ) : (
                  <p className="text-lg font-semibold text-foreground">
                    {lessonDetails?.name ?? "-"}
                  </p>
                )}
              </div>

              {isLoading && (
                <div className="h-72 animate-pulse rounded-2xl bg-muted" />
              )}

              {!isLoading && isLiveLesson && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setIsLiveContentOpen((current) => !current)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-accent/60"
                  >
                    <span className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-muted-foreground" />
                      {isLiveContentOpen ? "Ocultar video" : "Abrir video"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lessonDetails?.content ? "Clique para expandir" : "Sem conteudo"}
                    </span>
                  </button>
                  {isLiveContentOpen && (
                    <div className="relative mx-auto w-full max-w-4xl">
                      {editContentPreview || lessonDetails?.content ? (
                        <video
                          src={editContentPreview ?? lessonDetails?.content ?? undefined}
                          className="h-72 w-full rounded-2xl border border-border object-cover"
                          controls
                        />
                      ) : (
                        <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
                          Conteudo nao informado
                        </div>
                      )}
                      {isEditMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => editContentInputRef.current?.click()}
                            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
                          >
                            <Film className="h-4 w-4" />
                            Alterar video
                          </button>
                          <input
                            ref={editContentInputRef}
                            type="file"
                            onChange={(event) =>
                              setEditContentFile(event.target.files?.[0] ?? null)
                            }
                            className="sr-only"
                          />
                        </>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Material de suporte
                    </div>
                    {lessonDetails?.support_material ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={() => setIsSupportExpanded((current) => !current)}
                          >
                            {isSupportExpanded ? "Reduzir visualizacao" : "Ampliar visualizacao"}
                          </Button>
                          <a
                            href={lessonDetails.support_material}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            Abrir material em nova aba
                          </a>
                        </div>
                        <div
                          className={`w-full rounded-2xl border border-border ${
                            isSupportExpanded ? "h-[520px]" : "h-64"
                          }`}
                          style={{ resize: "vertical", overflow: "hidden" }}
                        >
                          <iframe
                            title="Material de suporte"
                            src={`${lessonDetails.support_material}#page=1`}
                            className="h-full w-full rounded-2xl"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem material de suporte.</p>
                    )}
                  </div>
                </div>
              )}

              {!isLoading && isAsyncLesson && (
                <div className="space-y-4">
                  <div className="relative">
                    {editContentPreview || lessonDetails?.content ? (
                      <video
                        src={editContentPreview ?? lessonDetails?.content ?? undefined}
                        className="h-72 w-full rounded-2xl border border-border object-cover"
                        controls
                      />
                    ) : (
                      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
                        Conteudo nao informado
                      </div>
                    )}
                    {isEditMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => editContentInputRef.current?.click()}
                          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
                        >
                          <Film className="h-4 w-4" />
                          Alterar video
                        </button>
                        <input
                          ref={editContentInputRef}
                          type="file"
                          onChange={(event) =>
                            setEditContentFile(event.target.files?.[0] ?? null)
                          }
                          className="sr-only"
                        />
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Material de suporte
                    </div>
                    {lessonDetails?.support_material ? (
                      <a
                        href={lessonDetails.support_material}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Abrir material de suporte
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem material de suporte.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-border bg-card px-6 py-5 shadow-sm">
            <legend className="sr-only">Detalhes adicionais</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tipo de aula
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {lessonDetails ? lessonTypeLabel : "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aula semanal
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {lessonDetails ? (lessonDetails.is_weekly ? "Sim" : "Nao") : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Exercicio associado
              </p>
              {isEditMode ? (
                <select
                  value={editExerciseId}
                  onChange={(event) =>
                    setEditExerciseId(event.target.value ? Number(event.target.value) : "")
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sem exercicio</option>
                  {exercisesSimple.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {lessonDetails?.exercise?.name ?? "Nenhum"}
                  </p>
                  {lessonDetails?.exercise && (
                    <p className="text-xs text-muted-foreground">
                      {lessonDetails.exercise.category} • {lessonDetails.exercise.difficulty_level}
                    </p>
                  )}
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conteudo do curso
                </p>
                <p className="text-sm font-semibold text-foreground">Aulas do modulo</p>
              </div>
              {isFetching && (
                <span className="text-xs font-medium text-primary">Atualizando...</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {sortedLessons.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma aula encontrada.</p>
              )}
              {sortedLessons.map((lesson) => (
                <LessonSidebarItem
                  key={lesson.id}
                  moduleId={moduleId}
                  lesson={lesson}
                  isActive={String(lesson.id) === lessonId}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function LessonSidebarItem({
  moduleId,
  lesson,
  isActive,
}: {
  moduleId: string;
  lesson: Lesson;
  isActive: boolean;
}) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewTimeout = useRef<number | null>(null);
  const isAsync = lesson.lesson_type === "asynchronous";
  const label = useMemo(() => (isAsync ? "Assincrono" : "Ao vivo"), [isAsync]);

  function stopPreview() {
    if (!previewRef.current) return;
    previewRef.current.pause();
    if (previewTimeout.current) {
      window.clearTimeout(previewTimeout.current);
      previewTimeout.current = null;
    }
  }

  function startPreview() {
    if (!previewRef.current) return;
    previewRef.current.currentTime = 0;
    previewRef.current.play().catch(() => undefined);
    previewTimeout.current = window.setTimeout(() => {
      stopPreview();
    }, 3000);
  }

  return (
    <Link
      href={`/courses/modules/${moduleId}/lessons/${lesson.id}`}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
        isActive
          ? "border-primary/60 bg-primary/10 shadow-sm"
          : "border-border bg-background hover:bg-accent/60"
      }`}
    >
      <div
        className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
        onMouseEnter={startPreview}
        onMouseLeave={stopPreview}
        onTouchStart={startPreview}
        onTouchEnd={stopPreview}
      >
        {lesson.content ? (
          <video
            ref={previewRef}
            src={lesson.content}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            Sem video
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{lesson.name}</p>
        <p className="text-xs text-muted-foreground">Ordem {lesson.order}</p>
      </div>
      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
          isAsync ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
