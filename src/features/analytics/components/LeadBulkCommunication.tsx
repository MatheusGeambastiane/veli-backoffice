"use client";

import { useState } from "react";
import { Ban, CalendarClock, CheckCircle2, Loader2, Send, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { HttpError } from "@/shared/lib/http/http";
import {
  useCancelPlacementLeadBulkCampaign,
  useCreatePlacementLeadBulkCampaign,
  usePlacementLeadBulkCampaign,
  usePlacementLeadWhatsappTemplates,
} from "@/features/analytics/queries/analyticsQueries";

function errorMessage(error: unknown) {
  if (!(error instanceof HttpError)) return "Não foi possível criar o disparo.";
  if (typeof error.details === "string") return error.details;
  if (error.details && typeof error.details === "object") {
    const detail = "detail" in error.details ? error.details.detail : Object.values(error.details).flat()[0];
    if (typeof detail === "string") return detail;
  }
  return "Não foi possível criar o disparo.";
}

export function LeadBulkCommunicationModal({
  leadIds,
  onClose,
  onCreated,
}: {
  leadIds: number[];
  onClose: () => void;
  onCreated: (campaignId: number) => void;
}) {
  const templates = usePlacementLeadWhatsappTemplates(leadIds[0]);
  const createCampaign = useCreatePlacementLeadBulkCampaign();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const selectedTemplate = templates.data?.find((item) => item.id === selectedTemplateId) ?? templates.data?.[0];
  const requiresParameters = Boolean(selectedTemplate && !selectedTemplate.uses_automatic_parameters && selectedTemplate.parameter_count > 0);
  const invalidParameters = Boolean(requiresParameters && selectedTemplate && (
    templateParams.length !== selectedTemplate.parameter_count || templateParams.some((item) => !item.trim())
  ));

  async function submit() {
    if (!selectedTemplate) return;
    setError("");
    try {
      const campaign = await createCampaign.mutateAsync({
        lead_ids: leadIds,
        template_name: selectedTemplate.name,
        template_language: selectedTemplate.language,
        template_params: selectedTemplate.uses_automatic_parameters ? [] : templateParams,
        scheduled_at: sendMode === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      onCreated(campaign.id);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-communication-title">
    <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div><h2 id="bulk-communication-title" className="text-lg font-semibold">Enviar comunicação</h2><p className="mt-1 text-sm text-muted-foreground">O template será enviado para {leadIds.length} {leadIds.length === 1 ? "lead selecionado" : "leads selecionados"}.</p></div>
        <Button variant="ghost" className="size-9 px-0" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button>
      </header>
      <div className="space-y-5 p-5">
        {templates.isLoading ? <p className="text-sm text-muted-foreground">Carregando templates…</p> : templates.isError ? <p className="text-sm text-destructive">Não foi possível carregar os templates.</p> : templates.data?.length ? <>
          <label className="block text-sm font-medium">Template do WhatsApp
            <select value={selectedTemplate?.id ?? ""} onChange={(event) => { const template = templates.data?.find((item) => item.id === event.target.value); setSelectedTemplateId(event.target.value); setTemplateParams(Array.from({ length: template?.parameter_count ?? 0 }, () => "")); }} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3">
              {templates.data.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.language}</option>)}
            </select>
          </label>
          {selectedTemplate?.preview ? <div className="rounded-xl border border-border bg-muted/25 p-4"><p className="mb-2 text-xs font-medium text-muted-foreground">Prévia</p><p className="whitespace-pre-line text-sm">{selectedTemplate.preview}</p></div> : null}
          {selectedTemplate?.uses_automatic_parameters ? <p className="text-xs text-muted-foreground">Os dados de cada lead serão preenchidos automaticamente.</p> : requiresParameters && selectedTemplate ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: selectedTemplate.parameter_count }, (_, index) => <input key={index} value={templateParams[index] ?? ""} onChange={(event) => setTemplateParams((current) => { const next = Array.from({ length: selectedTemplate.parameter_count }, (_, itemIndex) => current[itemIndex] ?? ""); next[index] = event.target.value; return next; })} placeholder={`Parâmetro ${index + 1}`} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />)}</div> : null}
          <fieldset className="space-y-3"><legend className="text-sm font-medium">Quando enviar</legend>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3"><input type="radio" name="send-mode" checked={sendMode === "now"} onChange={() => setSendMode("now")} /><span><span className="block text-sm font-medium">Enviar agora</span><span className="text-xs text-muted-foreground">A campanha entra imediatamente na fila do Celery.</span></span></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3"><input className="mt-1" type="radio" name="send-mode" checked={sendMode === "scheduled"} onChange={() => setSendMode("scheduled")} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium"><CalendarClock className="size-4" />Agendar disparo</span><span className="mt-1 block text-xs text-muted-foreground">O agendador verifica campanhas pendentes a cada 30 segundos.</span>{sendMode === "scheduled" ? <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /> : null}</span></label>
          </fieldset>
        </> : <p className="text-sm text-muted-foreground">Nenhum template aprovado encontrado.</p>}
        {error ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </div>
      <footer className="flex justify-end gap-3 border-t border-border p-5"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => void submit()} disabled={createCampaign.isPending || !selectedTemplate || invalidParameters || (sendMode === "scheduled" && !scheduledAt)}>{createCampaign.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{sendMode === "scheduled" ? "Agendar envio" : "Iniciar envio"}</Button></footer>
    </div>
  </div>;
}

export function LeadBulkCommunicationProgress({ campaignId, onDismiss }: { campaignId: number; onDismiss: () => void }) {
  const campaign = usePlacementLeadBulkCampaign(campaignId);
  const cancel = useCancelPlacementLeadBulkCampaign(campaignId);
  const data = campaign.data;
  if (!data) return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Carregando status do envio…</div>;
  const finished = data.status === "completed" || data.status === "canceled";
  return <section className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm" aria-live="polite">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex items-center gap-2">{finished ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Loader2 className="size-5 animate-spin text-primary" />}<h3 className="font-semibold">{data.status === "scheduled" ? "Envio agendado" : data.status === "canceled" ? "Envio cancelado" : data.status === "completed" ? "Envio concluído" : "Enviando comunicações"}</h3></div><p className="mt-1 text-sm text-muted-foreground">{data.sent_count} enviados de {data.total_count} · {data.failed_count} falharam{data.canceled_count ? ` · ${data.canceled_count} cancelados` : ""}</p>{data.scheduled_at ? <p className="mt-1 text-xs text-muted-foreground">Agendado para {new Date(data.scheduled_at).toLocaleString("pt-BR")}</p> : null}</div>
      <div className="flex gap-2">{data.can_cancel ? <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => void cancel.mutateAsync()}><Ban className="size-4" />Cancelar restantes</Button> : null}{finished ? <Button variant="ghost" size="sm" onClick={onDismiss}>Fechar</Button> : null}</div>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${data.progress_percent}%` }} /></div>
  </section>;
}
