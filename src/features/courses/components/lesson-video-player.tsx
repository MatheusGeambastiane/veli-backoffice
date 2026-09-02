"use client";

import { useEffect, useRef, useState } from "react";
import { Captions, MoveVertical, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  useLessonCaption,
  useUpdateLessonCaptionCues,
} from "@/features/courses/queries/coursesQueries";

type LessonVideoPlayerProps = {
  lessonId: string;
  src: string;
  showCaptionControls?: boolean;
};

const MIN_CAPTION_HEIGHT = 4;
const MAX_CAPTION_HEIGHT = 84;

export function LessonVideoPlayer({
  lessonId,
  src,
  showCaptionControls = true,
}: LessonVideoPlayerProps) {
  const { data: caption } = useLessonCaption(lessonId);
  const updateCaption = useUpdateLessonCaptionCues(lessonId);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isHeightSelectorOpen, setIsHeightSelectorOpen] = useState(false);
  const heightSelectorRef = useRef<HTMLDivElement | null>(null);
  const [appearanceDraft, setAppearanceDraft] = useState<{
    captionId: number | null;
    positionPercent: number;
    textColor: string;
    isDirty: boolean;
  }>({ captionId: null, positionPercent: 14, textColor: "#FFFFFF", isDirty: false });

  const canPreviewCaption = Boolean(
    showCaptionControls &&
      caption?.cues.length &&
      (caption.status === "review" || caption.status === "published"),
  );
  const isCurrentDraft = appearanceDraft.captionId === caption?.id;
  const positionPercent = isCurrentDraft
    ? appearanceDraft.positionPercent
    : (caption?.position_percent ?? 14);
  const textColor = isCurrentDraft
    ? appearanceDraft.textColor
    : (caption?.text_color ?? "#FFFFFF");
  const activeCue = captionsEnabled
    ? caption?.cues.find(
        (cue) => currentTimeMs >= cue.start_ms && currentTimeMs < cue.end_ms,
      )
    : undefined;

  useEffect(() => {
    if (!isHeightSelectorOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!heightSelectorRef.current?.contains(event.target as Node)) {
        setIsHeightSelectorOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHeightSelectorOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHeightSelectorOpen]);

  function updateAppearance(patch: { positionPercent?: number; textColor?: string }) {
    if (!caption) return;
    setAppearanceDraft({
      captionId: caption.id,
      positionPercent: patch.positionPercent ?? positionPercent,
      textColor: patch.textColor ?? textColor,
      isDirty: true,
    });
  }

  async function saveAppearance() {
    if (!caption || !appearanceDraft.isDirty) return;
    const updatedCaption = await updateCaption.mutateAsync({
      cues: caption.cues,
      position_percent: positionPercent,
      text_color: textColor,
    });
    setAppearanceDraft({
      captionId: updatedCaption.id,
      positionPercent: updatedCaption.position_percent,
      textColor: updatedCaption.text_color,
      isDirty: false,
    });
  }

  return (
    <div className="overflow-hidden bg-slate-950">
      <div className="relative aspect-video max-h-[min(72vh,760px)] w-full bg-black">
        <video
          src={src}
          className="h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={(event) =>
            setCurrentTimeMs(Math.round(event.currentTarget.currentTime * 1000))
          }
        />

        {canPreviewCaption && activeCue && (
          <div
            className="pointer-events-none absolute inset-x-4 flex justify-center px-2"
            style={{ bottom: `${positionPercent}%` }}
          >
            <span
              className="max-w-[88%] rounded-lg bg-black/85 px-3 py-1.5 text-center text-base font-semibold leading-relaxed shadow-xl md:text-lg"
              style={{
                color: textColor,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.95)",
              }}
            >
              {activeCue.text}
            </span>
          </div>
        )}
      </div>

      {canPreviewCaption && caption && (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-slate-950 px-3 py-2.5 text-white">
          <button
            type="button"
            onClick={() => setCaptionsEnabled((current) => !current)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors ${
              captionsEnabled
                ? "bg-white text-slate-950"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
            aria-label={captionsEnabled ? "Ocultar legenda" : "Exibir legenda"}
            aria-pressed={captionsEnabled}
          >
            <Captions className="h-4 w-4" />
            CC
          </button>

          <div ref={heightSelectorRef} className="relative">
            <button
              type="button"
              onClick={() => setIsHeightSelectorOpen((current) => !current)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-expanded={isHeightSelectorOpen}
              aria-controls="caption-height-selector"
            >
              <MoveVertical className="h-3.5 w-3.5" />
              Altura
              <span className="min-w-7 text-right tabular-nums text-white/65">
                {positionPercent}%
              </span>
            </button>

            {isHeightSelectorOpen && (
              <div
                id="caption-height-selector"
                role="group"
                aria-label="Ajustar altura da legenda"
                className="absolute bottom-11 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3 rounded-xl border border-white/15 bg-slate-900 px-3 py-3.5 shadow-2xl shadow-black/40"
              >
                <output
                  htmlFor="caption-height-range"
                  className="min-w-11 rounded-md bg-white/10 px-2 py-1 text-center text-[11px] font-semibold tabular-nums text-white"
                >
                  {positionPercent}%
                </output>
                <input
                  id="caption-height-range"
                  type="range"
                  min={MIN_CAPTION_HEIGHT}
                  max={MAX_CAPTION_HEIGHT}
                  step={1}
                  value={positionPercent}
                  onChange={(event) =>
                    updateAppearance({ positionPercent: Number(event.target.value) })
                  }
                  aria-label="Altura personalizada da legenda"
                  aria-valuetext={`${positionPercent}% da altura do vídeo`}
                  className="h-32 w-5 cursor-pointer accent-white"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-white/70">
            Cor
            <input
              type="color"
              value={textColor}
              onChange={(event) =>
                updateAppearance({ textColor: event.target.value.toUpperCase() })
              }
              className="h-8 w-9 cursor-pointer rounded-lg border border-white/15 bg-white/10 p-1"
              aria-label="Cor da legenda"
            />
          </label>

          {appearanceDraft.isDirty && (
            <Button
              type="button"
              size="sm"
              onClick={saveAppearance}
              disabled={updateCaption.isPending}
              className="ml-auto h-8 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {updateCaption.isPending ? "Salvando..." : "Salvar aparência"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
