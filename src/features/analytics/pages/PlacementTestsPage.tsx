"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Check, FileQuestion, Loader2, Pencil, Plus, Save, X } from "lucide-react";
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
] as const;

type DraftQuestion = Omit<PlacementQuestion, "id" | "language_name"> & { id?: number };

function blankOptions(): PlacementOption[] {
  return ["A", "B", "C", "D"].map((label, order) => ({ label, text: "", is_correct: order === 0, order }));
}

function QuestionEditor({ initial, languages, onClose }: { initial: DraftQuestion; languages: Array<{ id: number; name: string }>; onClose: () => void }) {
  const [draft, setDraft] = useState(initial);
  const saveQuestion = useSavePlacementQuestion();

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
    const { id, ...payload } = draft;
    saveQuestion.mutate({ id, payload }, { onSuccess: onClose });
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
            <div><div className="flex items-end justify-between"><div><h3 className="text-sm font-semibold">Alternativas</h3><p className="text-xs text-muted-foreground">Marque exatamente uma resposta correta.</p></div></div><div className="mt-3 space-y-3">{draft.options.map((option, index) => <div key={option.label} className={`flex items-center gap-3 rounded-xl border p-3 ${option.is_correct ? "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20" : "border-border"}`}><button type="button" onClick={() => selectCorrect(index)} className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${option.is_correct ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-background"}`} title="Marcar como correta">{option.is_correct ? <Check className="size-4" /> : option.label}</button><Input required value={option.text} onChange={(event) => changeOption(index, { text: event.target.value })} placeholder={`Alternativa ${option.label}`} /></div>)}</div></div>
            <label className="block text-sm font-medium">Explicação pedagógica <span className="font-normal text-muted-foreground">(opcional)</span><textarea value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Ordem<Input type="number" min={0} value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} className="mt-2" /></label><label className="mt-7 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} className="size-4 accent-primary" />Questão ativa no teste</label></div>
            {saveQuestion.error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Não foi possível salvar. Verifique se há quatro alternativas e apenas uma correta.</p> : null}
          </div>
          <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saveQuestion.isPending}>{saveQuestion.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar questão</Button></footer>
        </form>
      </aside>
    </div>
  );
}

export function PlacementTestsPage() {
  const { data: questions, isLoading } = usePlacementQuestions();
  const { data: languages } = useDashboardLanguages();
  const [editing, setEditing] = useState<DraftQuestion | null>(null);
  const availableLanguages = languages?.results ?? [];

  function createQuestion() {
    setEditing({ language: availableLanguages[0]?.id ?? 0, level: "A1", skill: "grammar", prompt: "", context: "", explanation: "", order: (questions?.count ?? 0) + 1, is_active: true, options: blankOptions() });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/analytics/leads" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar para leads</Link><PageHeader title="Gerenciar teste de nível" description="Organize o banco de questões por idioma, nível CEFR e habilidade avaliada." /></div><Button onClick={createQuestion} disabled={!availableLanguages.length}><Plus className="size-4" /> Nova questão</Button></div>
      <Card><CardContent className="p-0">{isLoading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : questions?.results.length ? <div className="divide-y divide-border">{questions.results.map((question) => <button key={question.id} type="button" onClick={() => setEditing({ ...question })} className="grid w-full gap-4 p-5 text-left transition hover:bg-muted/35 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className={`flex size-11 items-center justify-center rounded-xl font-bold ${question.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{question.level}</span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{question.language_name}</span><span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{skills.find((skill) => skill.value === question.skill)?.label}</span>{!question.is_active ? <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-700">Inativa</span> : null}</span><span className="mt-1 block truncate text-sm text-muted-foreground">{question.prompt}</span></span><span className="inline-flex items-center gap-2 text-xs font-medium text-primary"><Pencil className="size-4" /> Editar</span></button>)}</div> : <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center"><FileQuestion className="size-10 text-muted-foreground" /><p className="font-medium">Nenhuma questão cadastrada</p><p className="text-sm text-muted-foreground">Crie a primeira questão para habilitar um idioma no teste.</p></div>}</CardContent></Card>
      {editing ? <QuestionEditor key={editing.id ?? "new"} initial={editing} languages={availableLanguages} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
