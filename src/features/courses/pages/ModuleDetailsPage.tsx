"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Film,
  Search,
  Wand2,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  useCreateLesson,
  useExerciseDetails,
  useExercisesList,
  useModuleDetails,
  useModuleLessons,
} from "@/features/courses/queries/coursesQueries";
import type { Exercise, Lesson } from "@/features/courses/types/course";

type ModuleDetailsPageProps = {
  moduleId: string;
};

const LESSON_TYPE_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Ao vivo", value: "live" },
  { label: "Assincrono", value: "asynchronous" },
] as const;

const EXERCISE_DIFFICULTY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Facil", value: "easy" },
  { label: "Medio", value: "medium" },
  { label: "Dificil", value: "hard" },
] as const;

const EXERCISE_CATEGORY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Gramatica", value: "grammar" },
  { label: "Escuta", value: "listening" },
  { label: "Pronuncia", value: "pronunciation" },
] as const;

export function ModuleDetailsPage({ moduleId }: ModuleDetailsPageProps) {
  const [search, setSearch] = useState("");
  const [lessonType, setLessonType] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonStep, setLessonStep] = useState(1);
  const [lessonName, setLessonName] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonOrder, setLessonOrder] = useState<number | "">("");
  const [lessonTypeValue, setLessonTypeValue] = useState<"live" | "asynchronous">("live");
  const [isWeekly, setIsWeekly] = useState(false);
  const [supportMaterial, setSupportMaterial] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentPreview, setContentPreview] = useState<string | null>(null);
  const [supportPreview, setSupportPreview] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseDifficulty, setExerciseDifficulty] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseStep, setExerciseStep] = useState<"list" | "questions">("list");
  const deferredExerciseSearch = useDeferredValue(exerciseSearch.trim());

  const { data: moduleData, isLoading, isError } = useModuleDetails(moduleId);
  const { data: lessons = [], isFetching } = useModuleLessons(moduleId, {
    search: deferredSearch || undefined,
    lessonType: lessonType || undefined,
  });
  const createLesson = useCreateLesson();
  const { data: exercisesData } = useExercisesList({
    search: deferredExerciseSearch || undefined,
    difficultyLevel: exerciseDifficulty || undefined,
    category: exerciseCategory || undefined,
  });
  const exercises = exercisesData?.results ?? [];
  const { data: exerciseDetails } = useExerciseDetails(
    selectedExercise ? String(selectedExercise.id) : ""
  );

  const nextLessonOrder = useMemo(() => {
    const orders = lessons.map((lesson) => lesson.order);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    return maxOrder + 1;
  }, [lessons]);

  useEffect(() => {
    if (isLessonModalOpen) {
      setLessonOrder(nextLessonOrder);
    }
  }, [isLessonModalOpen, nextLessonOrder]);

  useEffect(() => {
    if (contentFile) {
      const url = URL.createObjectURL(contentFile);
      setContentPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setContentPreview(null);
    return undefined;
  }, [contentFile]);

  useEffect(() => {
    if (supportMaterial) {
      const url = URL.createObjectURL(supportMaterial);
      setSupportPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setSupportPreview(null);
    return undefined;
  }, [supportMaterial]);

  function openLessonModal() {
    setIsLessonModalOpen(true);
    setLessonStep(1);
  }

  function closeLessonModal() {
    setIsLessonModalOpen(false);
    resetLessonForm();
  }

  function resetLessonForm() {
    setLessonName("");
    setLessonDescription("");
    setLessonOrder("");
    setLessonTypeValue("live");
    setIsWeekly(false);
    setSupportMaterial(null);
    setContentFile(null);
    setContentPreview(null);
    setSupportPreview(null);
    setExerciseSearch("");
    setExerciseDifficulty("");
    setExerciseCategory("");
    setSelectedExercise(null);
    setExerciseStep("list");
  }

  function handleSelectExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setExerciseStep("questions");
  }

  async function handleCreateLesson() {
    if (!lessonName.trim() || !lessonOrder || createLesson.isPending) return;
    const formData = new FormData();
    formData.append("name", lessonName.trim());
    formData.append("description", lessonDescription.trim());
    formData.append("order", String(lessonOrder));
    formData.append("lesson_type", lessonTypeValue);
    formData.append("exercise", selectedExercise ? String(selectedExercise.id) : "null");
    formData.append("is_weekly", String(isWeekly));
    formData.append("module", String(moduleId));
    if (supportMaterial) formData.append("support_material", supportMaterial);
    if (contentFile) formData.append("content", contentFile);

    try {
      await createLesson.mutateAsync(formData);
      closeLessonModal();
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
          <p className="text-sm font-medium text-muted-foreground">Detalhes do modulo</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {moduleData?.name ?? "Modulo"}
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
          Erro ao carregar modulo.
        </div>
      )}

      {moduleData && !isLoading && !isError && (
        <>
          <fieldset className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <legend className="sr-only">Informacoes do modulo</legend>
            <div className="relative h-48 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              {moduleData.image && (
                <img src={moduleData.image} alt={moduleData.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-foreground">{moduleData.name}</h2>
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-border bg-card shadow-sm">
            <legend className="sr-only">Aulas do modulo</legend>
            <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aulas</p>
                <h2 className="text-lg font-semibold text-foreground">Lista de aulas</h2>
              </div>
              <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar aula pelo nome"
                    className="h-11 rounded-2xl border-border bg-background pl-9 shadow-sm"
                    aria-label="Buscar aulas"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <span className="text-xs uppercase tracking-wide">Modalidade</span>
                  <select
                    value={lessonType}
                    onChange={(event) => setLessonType(event.target.value)}
                    className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                    aria-label="Filtrar por modalidade"
                  >
                    {LESSON_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="button" className="h-11 rounded-2xl" onClick={openLessonModal}>
                  Adicionar aula
                </Button>
              </div>
            </div>

            <div className="px-6 py-5">
              {isFetching && (
                <p className="text-xs text-primary">Atualizando resultados...</p>
              )}
              {lessons.length === 0 ? (
                <div className="rounded-2xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Nenhuma aula encontrada para os filtros atuais.
                </div>
              ) : (
                <ul className="space-y-3">
                  {lessons.map((lesson) => (
                    <LessonRow key={lesson.id} lesson={lesson} />
                  ))}
                </ul>
              )}
            </div>
          </fieldset>
        </>
      )}

      {isLessonModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-lesson-title"
          onClick={closeLessonModal}
        >
          <div
            className="w-full max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nova aula</p>
                <h2 id="create-lesson-title" className="text-xl font-semibold text-foreground">
                  Adicionar aula
                </h2>
              </div>
              <button
                type="button"
                onClick={closeLessonModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar modal"
              >
                X
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className={lessonStep === 1 ? "text-foreground" : ""}>1. Dados</span>
              <span>•</span>
              <span className={lessonStep === 2 ? "text-foreground" : ""}>2. Arquivos</span>
              <span>•</span>
              <span className={lessonStep === 3 ? "text-foreground" : ""}>3. Exercicios</span>
              <span>•</span>
              <span className={lessonStep === 4 ? "text-foreground" : ""}>4. Confirmacao</span>
            </div>

            {lessonStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <Input
                      value={lessonName}
                      onChange={(event) => setLessonName(event.target.value)}
                      placeholder="Nome da aula"
                      className="h-11 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ordem</label>
                    <Input
                      type="number"
                      min={1}
                      value={lessonOrder}
                      onChange={(event) =>
                        setLessonOrder(event.target.value ? Number(event.target.value) : "")
                      }
                      className="h-11 rounded-2xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Descricao</label>
                  <textarea
                    value={lessonDescription}
                    onChange={(event) => setLessonDescription(event.target.value)}
                    className="min-h-[96px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Descricao da aula"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Modalidade</label>
                    <select
                      value={lessonTypeValue}
                      onChange={(event) =>
                        setLessonTypeValue(event.target.value as "live" | "asynchronous")
                      }
                      className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="live">Ao vivo</option>
                      <option value="asynchronous">Assincrono</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <span>Semanal</span>
                    <button
                      type="button"
                      onClick={() => setIsWeekly((current) => !current)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        isWeekly ? "bg-primary" : "bg-muted"
                      }`}
                      aria-pressed={isWeekly}
                    >
                      <span
                        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-background shadow transition-transform ${
                          isWeekly ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            )}

            {lessonStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Material de apoio</label>
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background px-3 py-3">
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                        <FileText className="h-4 w-4" />
                        Subir arquivo
                        <input
                          type="file"
                          onChange={(event) => setSupportMaterial(event.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                      </label>
                      {supportPreview && supportMaterial?.type === "application/pdf" && (
                        <iframe
                          title="Preview do PDF"
                          src={supportPreview}
                          className="h-40 w-full rounded-2xl border border-border"
                        />
                      )}
                      {supportPreview && supportMaterial?.type !== "application/pdf" && (
                        <p className="text-xs text-muted-foreground">
                          Arquivo selecionado: {supportMaterial?.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Conteudo da aula</label>
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background px-3 py-3">
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                        <Film className="h-4 w-4" />
                        Subir arquivo
                        <input
                          type="file"
                          onChange={(event) => setContentFile(event.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                      </label>
                      {contentPreview && contentFile?.type.startsWith("video") && (
                        <video
                          src={contentPreview}
                          className="h-40 w-full rounded-2xl border border-border object-cover"
                          controls
                        />
                      )}
                      {contentPreview && !contentFile?.type.startsWith("video") && (
                        <p className="text-xs text-muted-foreground">
                          Arquivo selecionado: {contentFile?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lessonStep === 3 && (
              <div className="space-y-4">
                <fieldset className="rounded-2xl border border-border bg-background px-4 py-4">
                  <legend className="text-sm font-semibold text-foreground">Exercicios</legend>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={exerciseSearch}
                        onChange={(event) => setExerciseSearch(event.target.value)}
                        placeholder="Buscar exercicio"
                        className="h-11 rounded-2xl border-border bg-card pl-9 shadow-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
                      <span className="text-xs uppercase tracking-wide">Dificuldade</span>
                      <select
                        value={exerciseDifficulty}
                        onChange={(event) => setExerciseDifficulty(event.target.value)}
                        className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                      >
                        {EXERCISE_DIFFICULTY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
                      <span className="text-xs uppercase tracking-wide">Categoria</span>
                      <select
                        value={exerciseCategory}
                        onChange={(event) => setExerciseCategory(event.target.value)}
                        className="bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                      >
                        {EXERCISE_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {exerciseStep === "list" && (
                    <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
                      {exercises.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum exercicio encontrado.</p>
                      )}
                      {exercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => handleSelectExercise(exercise)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm ${
                            selectedExercise?.id === exercise.id
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2 font-semibold">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            {exercise.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {exercise.category} • {exercise.difficulty_level}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {exerciseStep === "questions" && selectedExercise && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Wand2 className="h-4 w-4 text-muted-foreground" />
                          {selectedExercise.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => setExerciseStep("list")}
                          className="text-xs font-semibold text-primary"
                        >
                          Trocar exercicio
                        </button>
                      </div>
                      {exerciseDetails?.questions.length ? (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {exerciseDetails.questions.map((question) => (
                            <li
                              key={question.id}
                              className="rounded-xl border border-border/60 px-3 py-2"
                            >
                              {question.statement}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma questao encontrada.</p>
                      )}
                    </div>
                  )}
                </fieldset>
              </div>
            )}

            {lessonStep === 4 && (
              <div className="space-y-4">
                <fieldset className="rounded-2xl border border-border bg-background px-4 py-4">
                  <legend className="text-sm font-semibold text-foreground">Confirmacao</legend>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Nome:</span> {lessonName || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Descricao:</span>{" "}
                      {lessonDescription || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Ordem:</span>{" "}
                      {lessonOrder || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Modalidade:</span>{" "}
                      {lessonTypeValue === "live" ? "Ao vivo" : "Assincrono"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">E semanal:</span>{" "}
                      {isWeekly ? "Sim" : "Nao"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Modulo:</span> {moduleId}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Material de apoio:</span>{" "}
                      {supportMaterial?.name ?? "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Conteudo:</span>{" "}
                      {contentFile?.name ?? "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Exercicio:</span>{" "}
                      {selectedExercise?.name ?? "Nenhum"}
                    </p>
                  </div>
                </fieldset>
              </div>
            )}

            {createLesson.isError && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                Erro ao criar aula. Tente novamente.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLessonStep((current) => Math.max(1, current - 1))}
                disabled={lessonStep === 1}
              >
                Voltar
              </Button>
              {lessonStep < 4 ? (
                <Button
                  type="button"
                  onClick={() => setLessonStep((current) => Math.min(4, current + 1))}
                  disabled={
                    lessonStep === 1
                      ? !lessonName.trim() || !lessonOrder
                      : lessonStep === 2
                        ? false
                        : lessonStep === 3
                          ? false
                          : false
                  }
                >
                  Proxima
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateLesson}
                  disabled={!lessonName.trim() || !lessonOrder || createLesson.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createLesson.isPending ? "Salvando..." : "Criar aula"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
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
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        {isAsync ? (
          <div
            className="relative h-20 w-32 overflow-hidden rounded-xl border border-border bg-muted"
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
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                Sem video
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-border bg-muted text-xs text-muted-foreground">
            Ao vivo
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{lesson.name}</p>
          <p className="text-xs text-muted-foreground">Ordem {lesson.order}</p>
        </div>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
          isAsync ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
