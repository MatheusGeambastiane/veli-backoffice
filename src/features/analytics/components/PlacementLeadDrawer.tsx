"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Mail,
  MessageCircleMore,
  Phone,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { usePlacementLead, useUpdatePlacementLead } from "@/features/analytics/queries/analyticsQueries";
import type { PlacementLeadDetail } from "@/features/analytics/types/placementLeads";

const skillLabels = { grammar: "Gramática", vocabulary: "Vocabulário", reading: "Compreensão" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "Não concluído";
}

function LeadDetailContent({ lead, onClose }: { lead: PlacementLeadDetail; onClose: () => void }) {
  const [isContacted, setIsContacted] = useState(lead.is_contacted);
  const [observation, setObservation] = useState(lead.observation);
  const [copied, setCopied] = useState(false);
  const updateLead = useUpdatePlacementLead();

  async function copyPhone() {
    await navigator.clipboard.writeText(lead.phone);
    setCopied(true);
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.has_purchased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {lead.has_purchased ? "Cliente" : "Lead"}
              </span>
              <span className="text-xs text-muted-foreground">{lead.tests_count} {lead.tests_count === 1 ? "teste" : "testes"}</span>
            </div>
            <h2 className="truncate text-2xl font-semibold tracking-tight">{lead.name}</h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <button type="button" onClick={copyPhone} className="inline-flex items-center gap-2 transition hover:text-foreground" title="Copiar telefone">
                {copied ? <Check className="size-4 text-emerald-600" /> : <Phone className="size-4" />}
                {lead.phone} {copied ? "· copiado" : ""}
              </button>
              {lead.matched_user?.email || lead.email ? <span className="inline-flex items-center gap-2"><Mail className="size-4" />{lead.matched_user?.email || lead.email}</span> : null}
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Fechar detalhes" className="size-10 px-0"><X className="size-5" /></Button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Último nível</p><p className="mt-2 text-2xl font-semibold">{lead.estimated_level || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{lead.language_name}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Aquisição</p><p className="mt-2 truncate text-base font-semibold">{lead.utm_source || "Direto"}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(lead.started_at)}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Situação</p><p className={`mt-2 text-base font-semibold ${lead.has_purchased ? "text-emerald-700" : "text-amber-700"}`}>{lead.has_purchased ? "Compra encontrada" : "Ainda não comprou"}</p></div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><MessageCircleMore className="size-5 text-primary" /><div><h3 className="font-semibold">Acompanhamento comercial</h3><p className="text-xs text-muted-foreground">O status vale para todas as tentativas deste contato.</p></div></div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium">
            <input type="checkbox" checked={isContacted} onChange={(event) => setIsContacted(event.target.checked)} className="size-4 accent-primary" />
            Este lead já foi contatado
          </label>
          <label className="mt-4 block text-sm font-medium">Observação
            <textarea value={observation} onChange={(event) => setObservation(event.target.value)} rows={4} maxLength={5000} placeholder="Registre o retorno, interesse e próximo passo..." className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
          </label>
          <div className="mt-4 flex items-center justify-end gap-3">
            {updateLead.isSuccess ? <span className="text-xs text-emerald-700">Alterações salvas</span> : null}
            <Button disabled={updateLead.isPending} onClick={() => updateLead.mutate({ id: lead.id, is_contacted: isContacted, observation })}>
              {updateLead.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserRoundCheck className="size-4" />} Salvar acompanhamento
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" /><h3 className="font-semibold">Histórico de testes</h3></div>
          <div className="space-y-3">
            {lead.tests.map((test, testIndex) => (
              <details key={test.id} open={testIndex === 0} className="group overflow-hidden rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 marker:content-none">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{test.level || "…"}</span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{test.language}</span><span className="block text-xs text-muted-foreground">{formatDate(test.started_at)} · {test.correct_answers}/{test.questions_answered} acertos</span></span>
                  <span className="text-xs font-medium text-muted-foreground group-open:hidden">Ver respostas</span>
                  <span className="hidden text-xs font-medium text-muted-foreground group-open:block">Ocultar</span>
                </summary>
                <div className="border-t border-border bg-muted/20 p-4">
                  {test.answers.length ? <ol className="space-y-3">{test.answers.map((answer, index) => (
                    <li key={answer.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        {answer.is_correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>Questão {index + 1}</span><span>·</span><span>{skillLabels[answer.skill]}</span><span>·</span><span>{answer.question_level}</span></div>
                          <p className="mt-2 text-sm font-medium leading-6">{answer.question}</p>
                          <p className={`mt-2 text-sm ${answer.is_correct ? "text-emerald-700" : "text-rose-700"}`}>Respondeu: {answer.selected_option}</p>
                          {!answer.is_correct ? <p className="mt-1 text-xs text-muted-foreground">Resposta correta: {answer.correct_option}</p> : null}
                        </div>
                      </div>
                    </li>
                  ))}</ol> : <p className="text-sm text-muted-foreground">Nenhuma resposta registrada nesta tentativa.</p>}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><CircleDollarSign className="size-5 text-emerald-600" /><h3 className="font-semibold">Compras e ofertas</h3></div>
            <div className="mt-4 space-y-3">{lead.purchases.length ? lead.purchases.map((purchase) => <div key={purchase.id} className="rounded-lg bg-muted/40 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{purchase.offer}</p><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${purchase.checkout_status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{purchase.checkout_status === "active" ? "Ativa" : purchase.checkout_status}</span></div><p className="mt-1 text-xs text-muted-foreground">Pedido #{purchase.id} · {purchase.payment_type.toUpperCase()}</p></div>) : <p className="text-sm text-muted-foreground">Nenhuma compra associada ao telefone ou e-mail.</p>}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><BadgeCheck className="size-5 text-blue-600" /><h3 className="font-semibold">Matrículas</h3></div>
            <div className="mt-4 space-y-3">{lead.enrollments.length ? lead.enrollments.map((enrollment) => <div key={enrollment.id} className="rounded-lg bg-muted/40 p-3"><p className="font-medium">{enrollment.course}</p><p className="mt-1 text-xs text-muted-foreground">{enrollment.language} {enrollment.level ? `· ${enrollment.level}` : ""} · {enrollment.status}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{new Date(`${enrollment.class_start}T12:00:00`).toLocaleDateString("pt-BR")} a {new Date(`${enrollment.class_finish}T12:00:00`).toLocaleDateString("pt-BR")}</p></div>) : <p className="text-sm text-muted-foreground">Nenhuma matrícula encontrada.</p>}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PlacementLeadDrawer({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { data, isLoading, error } = usePlacementLead(leadId);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Detalhes do lead">
      <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Fechar detalhes" />
      <aside className="absolute inset-y-0 right-0 w-full max-w-4xl shadow-2xl">
        {isLoading ? <div className="flex h-full items-center justify-center bg-background"><Loader2 className="size-7 animate-spin text-primary" /></div> : error || !data ? <div className="flex h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center"><XCircle className="size-9 text-destructive" /><p>Não foi possível carregar este lead.</p><Button onClick={onClose}>Fechar</Button></div> : <LeadDetailContent key={`${data.id}-${data.contacted_at}-${data.observation}`} lead={data} onClose={onClose} />}
      </aside>
    </div>
  );
}
