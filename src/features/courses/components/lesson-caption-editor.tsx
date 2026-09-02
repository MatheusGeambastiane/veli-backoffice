"use client";

import { useState } from "react";
import { Captions, Check, Clock3, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { LessonCaptionCue, LessonCaptionStatus } from "@/features/courses/types/course";
import {
  useGenerateLessonCaption,
  useLessonCaption,
  usePublishLessonCaption,
  useUpdateLessonCaptionCues,
} from "@/features/courses/queries/coursesQueries";

const STATUS_LABELS: Record<LessonCaptionStatus, string> = {
  pending: "Na fila",
  processing: "Gerando texto",
  review: "Aguardando revisão",
  published: "Publicada",
  outdated: "Vídeo alterado",
  failed: "Falha na geração",
};

type LessonCaptionEditorProps = {
  lessonId: string;
  hasVideo: boolean;
};

export function LessonCaptionEditor({ lessonId, hasVideo }: LessonCaptionEditorProps) {
  const { data: caption, isLoading } = useLessonCaption(lessonId);
  const generateCaption = useGenerateLessonCaption(lessonId);
  const updateCues = useUpdateLessonCaptionCues(lessonId);
  const publishCaption = usePublishLessonCaption(lessonId);
  const [draft, setDraft] = useState<{
    captionId: number | null;
    cues: LessonCaptionCue[];
    isDirty: boolean;
  }>({ captionId: null, cues: [], isDirty: false });
  const cues = draft.captionId === caption?.id ? draft.cues : (caption?.cues ?? []);
  const isDirty = draft.captionId === caption?.id && draft.isDirty;

  const isProcessing = caption?.status === "pending" || caption?.status === "processing";
  const canEdit = Boolean(caption && ["review", "published"].includes(caption.status));
  const hasInvalidCue = cues.some(
    (cue) => !cue.text.trim() || cue.end_ms <= cue.start_ms
  );
  const mutationError = generateCaption.error || updateCues.error || publishCaption.error;

  function updateCue(index: number, patch: Partial<LessonCaptionCue>) {
    if (!caption) return;
    setDraft({
      captionId: caption.id,
      cues: cues.map((cue, cueIndex) =>
        cueIndex === index ? { ...cue, ...patch } : cue
      ),
      isDirty: true,
    });
  }

  async function handleSave() {
    if (!caption || hasInvalidCue || !cues.length) return;
    const updatedCaption = await updateCues.mutateAsync({
      cues,
      position_percent: caption.position_percent,
      text_color: caption.text_color,
    });
    setDraft({
      captionId: updatedCaption.id,
      cues: updatedCaption.cues,
      isDirty: false,
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
            <Captions className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Legenda do vídeo</h2>
              {caption && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABELS[caption.status]}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gere o texto em português, revise cada trecho e publique quando estiver pronto para os alunos.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={caption ? "outline" : "default"}
          onClick={() => generateCaption.mutate()}
          disabled={!hasVideo || isProcessing || generateCaption.isPending}
          className="gap-2"
        >
          {generateCaption.isPending || isProcessing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {caption ? "Gerar novamente" : "Gerar legenda"}
        </Button>
      </div>

      <div className="space-y-4 px-6 py-5">
        {!hasVideo && (
          <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Envie um vídeo MP4 ou WebM para habilitar a geração automática.
          </p>
        )}

        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-muted" />}

        {isProcessing && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            O vídeo está sendo transcrito. Esta tela será atualizada automaticamente.
          </div>
        )}

        {caption?.status === "failed" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {caption.failure_reason || "Não foi possível gerar a legenda."}
          </div>
        )}

        {caption?.status === "outdated" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            O vídeo foi alterado. Gere uma nova legenda antes de publicar.
          </div>
        )}

        {canEdit && cues.length > 0 && (
          <>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {cues.map((cue, index) => (
                <div
                  key={cue.id ?? `${cue.sequence}-${index}`}
                  className="grid gap-3 rounded-2xl border border-border bg-background p-4 lg:grid-cols-[150px_minmax(0,1fr)]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Trecho {index + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <TimeInput
                        label="Início"
                        value={cue.start_ms}
                        onChange={(value) => updateCue(index, { start_ms: value })}
                      />
                      <TimeInput
                        label="Fim"
                        value={cue.end_ms}
                        onChange={(value) => updateCue(index, { end_ms: value })}
                      />
                    </div>
                  </div>
                  <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Texto
                    <textarea
                      value={cue.text}
                      maxLength={500}
                      onChange={(event) => updateCue(index, { text: event.target.value })}
                      className="min-h-24 w-full resize-y rounded-2xl border border-border bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                {cues.length} trechos • revise os textos antes de publicar
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSave}
                  disabled={!isDirty || hasInvalidCue || updateCues.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateCues.isPending ? "Salvando..." : "Salvar revisão"}
                </Button>
                <Button
                  type="button"
                  onClick={() => publishCaption.mutate()}
                  disabled={isDirty || publishCaption.isPending || caption?.status === "published"}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {caption?.status === "published" ? "Publicada" : "Publicar para alunos"}
                </Button>
              </div>
            </div>
          </>
        )}

        {mutationError && (
          <p className="text-sm text-destructive">Não foi possível concluir a ação. Tente novamente.</p>
        )}
      </div>
    </section>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-[10px] text-muted-foreground">
      {label}
      <input
        type="number"
        min={0}
        step={0.1}
        value={(value / 1000).toFixed(1)}
        onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value) * 1000)))}
        className="h-9 w-full rounded-xl border border-border bg-card px-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
