"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, MessageCircle, MousePointerClick, Send, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { HttpError } from "@/shared/lib/http/http";
import {
  usePlacementLeadCommunications,
  usePlacementLeadWhatsappTemplates,
  useSendPlacementLeadCommunication,
} from "@/features/analytics/queries/analyticsQueries";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bahia",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (!(error instanceof HttpError)) return "Não foi possível enviar o template.";
  if (typeof error.details === "string") return error.details;
  if (Array.isArray(error.details)) return error.details.filter((item) => typeof item === "string").join(" ");
  if (error.details && typeof error.details === "object") {
    const message = Object.values(error.details).flat().find((item) => typeof item === "string");
    if (typeof message === "string") return message;
  }
  return "Não foi possível enviar o template.";
}

export function LeadCommunicationTab({ leadId, phone }: { leadId: number; phone: string }) {
  const communications = usePlacementLeadCommunications(leadId);
  const templates = usePlacementLeadWhatsappTemplates(leadId);
  const sendCommunication = useSendPlacementLeadCommunication(leadId);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const selectedTemplate = templates.data?.find((item) => item.id === selectedTemplateId) ?? templates.data?.[0];
  const requiresParameters = Boolean(selectedTemplate && !selectedTemplate.uses_automatic_parameters && selectedTemplate.parameter_count > 0);

  async function sendTemplate() {
    if (!selectedTemplate) return;
    setFeedback(null);
    try {
      await sendCommunication.mutateAsync({
        message_type: "template",
        template_name: selectedTemplate.name,
        template_language: selectedTemplate.language,
        template_params: selectedTemplate.uses_automatic_parameters ? [] : templateParams,
      });
      setFeedback("Template enviado com sucesso. A etapa comercial foi atualizada.");
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><MessageCircle className="size-5" /></span>
          <div><h3 className="font-semibold">Enviar template pelo WhatsApp</h3><p className="mt-1 text-sm text-muted-foreground">Destino: {phone}</p></div>
        </div>
        {templates.isLoading ? <p className="mt-5 text-sm text-muted-foreground">Carregando templates…</p> : templates.isError ? <p role="alert" className="mt-5 text-sm text-destructive">Não foi possível carregar os templates.</p> : templates.data?.length ? <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium">Template
            <select value={selectedTemplate?.id ?? ""} onChange={(event) => { const template = templates.data?.find((item) => item.id === event.target.value); setSelectedTemplateId(event.target.value); setTemplateParams(Array.from({ length: template?.parameter_count ?? 0 }, () => "")); }} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3">
              {templates.data.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.language}</option>)}
            </select>
          </label>
          {selectedTemplate?.preview ? <p className="whitespace-pre-line rounded-lg border border-border bg-muted/25 p-3 text-sm text-muted-foreground">{selectedTemplate.preview}</p> : null}
          {selectedTemplate?.uses_automatic_parameters ? <p className="text-xs text-muted-foreground">Nome e idioma serão preenchidos automaticamente.</p> : requiresParameters && selectedTemplate ? <div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: selectedTemplate.parameter_count }, (_, index) => <input key={index} value={templateParams[index] ?? ""} onChange={(event) => setTemplateParams((current) => { const next = Array.from({ length: selectedTemplate.parameter_count }, (_, itemIndex) => current[itemIndex] ?? ""); next[index] = event.target.value; return next; })} placeholder={`Parâmetro ${index + 1}`} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />)}</div> : null}
          <Button onClick={() => void sendTemplate()} disabled={sendCommunication.isPending || !selectedTemplate || (requiresParameters && (templateParams.length !== selectedTemplate.parameter_count || templateParams.some((item) => !item.trim())))}><Send className="size-4" />{sendCommunication.isPending ? "Enviando…" : "Enviar template"}</Button>
        </div> : <p className="mt-5 text-sm text-muted-foreground">Nenhum template aprovado encontrado.</p>}
        {feedback ? <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${sendCommunication.isError ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700"}`}>{feedback}</p> : null}
      </section>

      <section>
        <div className="mb-3"><h3 className="font-semibold">Histórico da conversa</h3><p className="mt-1 text-xs text-muted-foreground">Respostas recebidas são atualizadas automaticamente.</p></div>
        {communications.isLoading ? <p className="text-sm text-muted-foreground">Carregando histórico…</p> : communications.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar o histórico.</p> : communications.data?.length ? <div className="space-y-3">{communications.data.map((communication) => <article key={communication.id} className={`max-w-[85%] rounded-xl border p-4 ${communication.direction === "inbound" ? "mr-auto border-border bg-card" : "ml-auto border-primary/20 bg-primary/5"}`}>
          <div className="flex flex-wrap items-center gap-2">
            {communication.status === "failed" ? <XCircle className="size-4 text-destructive" /> : communication.status === "processing" || communication.status === "pending" ? <Clock3 className="size-4 text-amber-600" /> : <CheckCircle2 className="size-4 text-emerald-600" />}
            <span className="text-xs font-semibold">{communication.direction === "inbound" ? "Resposta do lead" : communication.template_name ? `Template: ${communication.template_name}` : "Mensagem enviada"}</span>
            {communication.button_clicked ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700"><MousePointerClick className="size-3" />Clicou no botão</span> : null}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm">{communication.body_text || "Mensagem sem conteúdo textual"}</p>
          {communication.button_clicked && communication.interactive_id ? <p className="mt-2 text-xs text-muted-foreground">Botão: {communication.interactive_id}</p> : null}
          {communication.last_error ? <p className="mt-2 text-xs text-destructive">Falha: {communication.last_error}</p> : null}
          <p className="mt-2 text-right text-[11px] text-muted-foreground">{formatDate(communication.occurred_at)}</p>
        </article>)}</div> : <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma comunicação registrada.</p>}
      </section>
    </div>
  );
}
