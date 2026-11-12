"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, FileQuestion, FileText, Headphones, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { useDashboardLanguages, usePlacementQuestions, useSavePlacementQuestion } from "@/features/analytics/queries/analyticsQueries";
import type { PlacementOption, PlacementQuestion } from "@/features/analytics/types/placementLeads";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { PageHeader } from "@/shared/components/ui/page";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const skills = [
  { value: "grammar", label: "Gramática" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "reading", label: "Compreensão" },
  { value: "listening", label: "Compreensão auditiva" },
] as const;

type DraftQuestion = Omit<PlacementQuestion, "id" | "language_name"> & { id?: number };

function blankOptions(): PlacementOption[] {
  return ["A", "B", "C", "D"].map((label, order) => ({ label, text: "", is_correct: order === 0, order }));
}

function QuestionEditor({ initial, languages, onClose }: { initial: DraftQuestion; languages: Array<{ id: number; name: string }>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const saveQuestion = useSavePlacementQuestion();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [removeAudio, setRemoveAudio] = useState(false);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState("");
  const hasAudio = !!audioFile || (!removeAudio && !!draft.audio_url);

  useEffect(() => {
    if (!audioFile) return;
    const url = URL.createObjectURL(audioFile);
    if (audioPlayer.current) audioPlayer.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  function changeOption(index: number, changes: Partial<PlacementOption>) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, ...changes } : option),
    }));
  }

  function selectCorrect(index: number) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({ ...option, is_correct: optionIndex === index })),
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (audioError) return;
    const { id, audio_url, ...payload } = draft;
    void audio_url;
    saveQuestion.mutate({ id, payload: { ...payload, ...(audioFile ? { audio: audioFile } : removeAudio ? { audio: null } : {}) } }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={draft.id ? "Editar questão" : "Nova questão"}>
      <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Fechar editor" />
      <aside className="absolute inset-y-0 right-0 w-full max-w-3xl overflow-y-auto bg-background shadow-2xl">
        <form onSubmit={submit}>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Banco adaptativo</p><h2 className="mt-1 text-xl font-semibold">{draft.id ? "Editar questão" : "Criar questão"}</h2></div>
            <Button type="button" variant="ghost" onClick={onClose} className="size-10 px-0" aria-label="Fechar"><X className="size-5" /></Button>
          </header>
          <div className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">Idioma<select required value={draft.language || ""} onChange={(event) => setDraft({ ...draft, language: Number(event.target.value) })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Selecione</option>{languages.map((language) => <option key={language.id} value={language.id}>{language.name}</option>)}</select></label>
              <label className="text-sm font-medium">Nível<select value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{levels.map((level) => <option key={level}>{level}</option>)}</select></label>
              <label className="text-sm font-medium">Habilidade<select value={draft.skill} onChange={(event) => setDraft({ ...draft, skill: event.target.value as DraftQuestion["skill"] })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{skills.map((skill) => <option key={skill.value} value={skill.value}>{skill.label}</option>)}</select></label>
            </div>
            <label className="block text-sm font-medium">Enunciado<textarea required value={draft.prompt} onChange={(event) => setDraft({ ...draft, prompt: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
            <label className="block text-sm font-medium">Texto de apoio <span className="font-normal text-muted-foreground">(opcional)</span><textarea value={draft.context} onChange={(event) => setDraft({ ...draft, context: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
            <fieldset className="space-y-4 rounded-xl border border-border p-4">
              <legend className="px-2 text-sm font-semibold">Áudio da questão</legend>
              <p className="text-xs text-muted-foreground">Envie um arquivo de áudio com permissão de uso (MP3, WAV, OGG, M4A ou WebM; até 20 MB). Para compreensão auditiva, informe também a transcrição para revisão interna.</p>
              <label className="block text-sm font-medium">Arquivo de áudio<Input type="file" accept=".mp3,.wav,.ogg,.m4a,.webm" required={draft.skill === "listening" && !hasAudio} onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && (file.size > 20 * 1024 * 1024 || !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name))) {
                  setAudioError("Selecione um áudio MP3, WAV, OGG, M4A ou WebM de até 20 MB.");
                  event.target.value = "";
                  setAudioFile(null);
                  return;
                }
                setAudioError("");
                setAudioFile(file);
                setRemoveAudio(false);
              }} className="mt-2" /></label>
              {audioError ? <p role="alert" className="text-sm text-destructive">{audioError}</p> : null}
              {hasAudio ? <audio ref={audioPlayer} controls preload="none" src={audioFile ? undefined : draft.audio_url} aria-label="Prévia do áudio" className="w-full" /> : null}
              {draft.audio_url && !audioFile ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={removeAudio} onChange={(event) => setRemoveAudio(event.target.checked)} />Remover áudio atual ao salvar</label> : null}
              <label className="block text-sm font-medium">Fonte original<Input type="url" pattern="https://.*" required={hasAudio} value={draft.audio_source_url ?? ""} onChange={(event) => setDraft({ ...draft, audio_source_url: event.target.value })} className="mt-2" /></label>
              <label className="block text-sm font-medium">Créditos e autoria<Input required={hasAudio} value={draft.audio_credit ?? ""} onChange={(event) => setDraft({ ...draft, audio_credit: event.target.value })} className="mt-2" /></label>
              <label className="block text-sm font-medium">Licença<Input required={hasAudio} value={draft.audio_license ?? ""} onChange={(event) => setDraft({ ...draft, audio_license: event.target.value })} placeholder="Ex.: CC BY 4.0 ou gravação própria" className="mt-2" /></label>
              <label className="block text-sm font-medium">Transcrição (somente administração)<textarea required={draft.skill === "listening"} value={draft.audio_transcript ?? ""} onChange={(event) => setDraft({ ...draft, audio_transcript: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label>
              <p className="text-xs text-muted-foreground">Não copie a transcrição para o texto de apoio: esse texto é exibido durante o teste.</p>
            </fieldset>
            <div><div className="flex items-end justify-between"><div><h3 className="text-sm font-semibold">Alternativas</h3><p className="text-xs text-muted-foreground">Marque exatamente uma resposta correta.</p></div></div><div className="mt-3 space-y-3">{draft.options.map((option, index) => <div key={option.label} className={`flex items-center gap-3 rounded-xl border p-3 ${option.is_correct ? "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20" : "border-border"}`}><button type="button" onClick={() => selectCorrect(index)} className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${option.is_correct ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-background"}`} title="Marcar como correta">{option.is_correct ? <Check className="size-4" /> : option.label}</button><Input required value={option.text} onChange={(event) => changeOption(index, { text: event.target.value })} placeholder={`Alternativa ${option.label}`} /></div>)}</div></div>
            <label className="block text-sm font-medium">Explicação pedagógica <span className="font-normal text-muted-foreground">(opcional)</span><textarea value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Ordem<Input type="number" min={0} value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} className="mt-2" /></label><label className="mt-7 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} className="size-4 accent-primary" />Questão ativa no teste</label></div>
            {saveQuestion.error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Não foi possível salvar. Verifique as alternativas, a resposta correta e os campos obrigatórios do áudio.</p> : null}
          </div>
          <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saveQuestion.isPending}>{saveQuestion.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar questão</Button></footer>
        </form>
      </aside>
    </div>
  );
}

export function PlacementTestsPage() {
  const [filters, setFilters] = useState<{ language: string; level: string; skill: PlacementQuestion["skill"] | "" }>({ language: "", level: "", skill: "" });
  const [page, setPage] = useState(1);
  const { data: questions, isLoading, error, refetch } = usePlacementQuestions({ ...filters, page });
  const { data: languages } = useDashboardLanguages();
  const [editing, setEditing] = useState<DraftQuestion | null>(null);
  const availableLanguages = languages?.results ?? [];
  const hasFilters = !!(filters.language || filters.level || filters.skill);
  const selectClassName = "mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  function clearFilters() {
    setFilters({ language: "", level: "", skill: "" });
    setPage(1);
  }

  function createQuestion() {
    setEditing({ language: Number(filters.language) || availableLanguages[0]?.id || 0, level: filters.level || "A1", skill: filters.skill || "grammar", prompt: "", context: "", explanation: "", audio_url: "", audio_source_url: "", audio_credit: "", audio_license: "", audio_transcript: "", order: 0, is_active: true, options: blankOptions() });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/analytics/leads" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar para leads</Link>
          <PageHeader title="Gerenciar teste de nível" description="Organize o banco de questões por idioma, nível CEFR e habilidade avaliada." />
        </div>
        <Button onClick={createQuestion} disabled={!availableLanguages.length}><Plus className="size-4" /> Nova questão</Button>
      </div>

      <fieldset className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <legend className="sr-only">Filtros das questões</legend>
        <label className="text-sm font-medium">Idioma
          <select value={filters.language} onChange={(event) => { setFilters({ ...filters, language: event.target.value }); setPage(1); }} className={selectClassName}>
            <option value="">Todos os idiomas</option>
            {availableLanguages.map((language) => <option key={language.id} value={language.id}>{language.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Nível
          <select value={filters.level} onChange={(event) => { setFilters({ ...filters, level: event.target.value }); setPage(1); }} className={selectClassName}>
            <option value="">Todos os níveis</option>
            {levels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Habilidade
          <select value={filters.skill} onChange={(event) => { setFilters({ ...filters, skill: event.target.value as typeof filters.skill }); setPage(1); }} className={selectClassName}>
            <option value="">Todas as habilidades</option>
            {skills.map((skill) => <option key={skill.value} value={skill.value}>{skill.label}</option>)}
          </select>
        </label>
        <Button variant="outline" onClick={clearFilters} disabled={!hasFilters} className="self-end">Limpar filtros</Button>
      </fieldset>
      {questions && !error ? <p className="text-sm text-muted-foreground" role="status">{questions.count} {questions.count === 1 ? "questão encontrada" : "questões encontradas"}</p> : null}
      <Card><CardContent className="p-0">
        {isLoading ? <div role="status" className="flex min-h-72 items-center justify-center gap-2"><Loader2 className="size-7 animate-spin text-primary" /><span className="sr-only">Carregando questões</span></div>
          : error ? <div role="alert" className="p-8 text-center"><p className="text-sm text-destructive">Não foi possível carregar as questões.</p><Button variant="outline" className="mt-4" onClick={() => void refetch()}>Tentar novamente</Button></div>
          : questions?.results.length ? <div className="divide-y divide-border">
            {questions.results.map((question) => {
              const hasAudio = !!question.audio_url?.trim();
              return <button key={question.id} type="button" onClick={() => setEditing({ ...question })} className="grid w-full gap-4 p-5 text-left transition hover:bg-muted/35 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className={`flex size-11 items-center justify-center rounded-xl font-bold ${question.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{question.level}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{question.language_name}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{skills.find((skill) => skill.value === question.skill)?.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${hasAudio ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-muted text-muted-foreground"}`}>
                      {hasAudio ? <Headphones className="size-3.5" aria-hidden="true" /> : <FileText className="size-3.5" aria-hidden="true" />}
                      {hasAudio ? "Com áudio" : "Sem áudio"}
                    </span>
                    {!question.is_active ? <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-700">Inativa</span> : null}
                  </span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">{question.prompt}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-primary"><Pencil className="size-4" /> Editar</span>
              </button>;
            })}
          </div> : <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <FileQuestion className="size-10 text-muted-foreground" />
            <p className="font-medium">{hasFilters ? "Nenhuma questão encontrada para estes filtros" : "Nenhuma questão cadastrada"}</p>
            {hasFilters ? <Button variant="outline" onClick={clearFilters}>Ver todas as questões</Button> : <p className="text-sm text-muted-foreground">Crie a primeira questão para habilitar um idioma no teste.</p>}
          </div>}
      </CardContent></Card>
      {questions && (questions.next || questions.previous) ? <nav aria-label="Páginas de questões" className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={!questions.previous || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
        <span className="text-sm text-muted-foreground">Página {page}</span>
        <Button variant="outline" disabled={!questions.next || isLoading} onClick={() => setPage((current) => current + 1)}>Próxima</Button>
      </nav> : null}
      {editing ? <QuestionEditor key={editing.id ?? "new"} initial={editing} languages={availableLanguages} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
