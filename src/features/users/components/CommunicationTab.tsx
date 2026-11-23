"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, FileText, MessageCircle, RefreshCw, Send, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { HttpError } from "@/shared/lib/http/http";
import {
  useDashboardUserCommunications,
  useDashboardUserWhatsappTemplates,
  useSendDashboardUserCommunication,
} from "@/features/users/queries/usersQueries";
import type { DashboardUserCommunication } from "@/features/users/types/dashboardUserDetails";

type CommunicationTabProps = {
  userId: string;
  phone: string | null;
};

const STATUS_LABELS: Record<DashboardUserCommunication["status"], string> = {
  pending: "Aguardando envio",
  processing: "Enviando",
  sent: "Enviado",
  failed: "Falhou",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bahia",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (!(error instanceof HttpError)) return "Não foi possível solicitar o envio.";
  const details = error.details;
  if (typeof details === "string") return details;
  if (Array.isArray(details) && typeof details[0] === "string") return details[0];
  if (details && typeof details === "object") {
    if ("last_error" in details && typeof details.last_error === "string" && details.last_error) {
      return `Falha no envio: ${details.last_error}`;
    }
    const values = Object.values(details as Record<string, unknown>).flat();
    const firstMessage = values.find((value) => typeof value === "string");
    if (typeof firstMessage === "string") return firstMessage;
  }
  return "Não foi possível solicitar o envio.";
}

export function CommunicationTab({ userId, phone }: CommunicationTabProps) {
  const communications = useDashboardUserCommunications(userId);
  const templates = useDashboardUserWhatsappTemplates(userId);
  const sendCommunication = useSendDashboardUserCommunication(userId);
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckDelivery = async () => {
    setIsChecking(true);
    setCheckFeedback(null);
    try {
      const result = await communications.refetch({ throwOnError: true });
      const pending = result.data?.some((item) => item.status === "pending");
      setCheckFeedback(
        pending
          ? "Status atualizado. Há mensagens aguardando processamento na fila de envio."
          : "Status de envio atualizado.",
      );
    } catch {
      setCheckFeedback("Não foi possível checar o envio. Tente novamente.");
    } finally {
      setIsChecking(false);
    }
  };
  const selectedTemplate =
    templates.data?.find((template) => template.id === selectedTemplateId) ?? templates.data?.[0];
  const requiresManualParameters = Boolean(
    selectedTemplate &&
      !selectedTemplate.uses_automatic_parameters &&
      selectedTemplate.parameter_count > 0,
  );

  const handleTemplate = async () => {
    if (!selectedTemplate) return;
    setFeedback(null);
    try {
      await sendCommunication.mutateAsync({
        message_type: "template",
        template_name: selectedTemplate.name,
        template_language: selectedTemplate.language,
        template_params: selectedTemplate.uses_automatic_parameters ? [] : templateParams,
      });
      setFeedback("Template aceito pelo Zernio para envio.");
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  };

  const handleMessage = async () => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return;
    setFeedback(null);
    try {
      await sendCommunication.mutateAsync({ message_type: "text", message: normalizedMessage });
      setMessage("");
      setFeedback("Mensagem aceita pelo Zernio para envio.");
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Comunicação por WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie mensagens pela Zernio para {phone || "o telefone cadastrado do usuário"}.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Template aprovado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione uma das variantes aprovadas na conta WhatsApp da Zernio.
              </p>
              {templates.isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground">Carregando templates...</p>
              ) : templates.isError ? (
                <p className="mt-4 text-sm text-destructive">Não foi possível carregar os templates.</p>
              ) : templates.data?.length ? (
                <div className="mt-4 space-y-3">
                  <label htmlFor="whatsapp-template" className="block text-xs font-medium text-muted-foreground">
                    Template
                  </label>
                  <select
                    id="whatsapp-template"
                    value={selectedTemplate?.id ?? ""}
                    onChange={(event) => {
                      const template = templates.data?.find((item) => item.id === event.target.value);
                      setSelectedTemplateId(event.target.value);
                      setTemplateParams(Array.from({ length: template?.parameter_count ?? 0 }, () => ""));
                    }}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    {templates.data.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} · {template.language}
                      </option>
                    ))}
                  </select>

                  {selectedTemplate?.preview && (
                    <p className="rounded-xl border border-border bg-background p-3 text-xs whitespace-pre-line text-muted-foreground">
                      {selectedTemplate.preview}
                    </p>
                  )}

                  {selectedTemplate?.uses_automatic_parameters ? (
                    <p className="text-xs text-muted-foreground">
                      Nome e idioma serão preenchidos automaticamente com os dados do lead.
                    </p>
                  ) : requiresManualParameters && selectedTemplate ? (
                    <div className="grid gap-2">
                      {Array.from({ length: selectedTemplate.parameter_count }, (_, index) => (
                        <input
                          key={index}
                          value={templateParams[index] ?? ""}
                          onChange={(event) =>
                            setTemplateParams((current) => {
                              const next = Array.from(
                                { length: selectedTemplate.parameter_count },
                                (_, parameterIndex) => current[parameterIndex] ?? "",
                              );
                              next[index] = event.target.value;
                              return next;
                            })
                          }
                          placeholder={`Parâmetro ${index + 1}`}
                          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum template aprovado encontrado.</p>
              )}
              <Button
                type="button"
                className="mt-4 rounded-xl"
                onClick={() => void handleTemplate()}
                disabled={
                  sendCommunication.isPending ||
                  !phone ||
                  !selectedTemplate ||
                  (requiresManualParameters &&
                    (templateParams.length !== selectedTemplate.parameter_count ||
                      templateParams.some((parameter) => !parameter.trim())))
                }
              >
                <Send className="h-4 w-4" />
                Disparar template
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/20 p-5">
          <label htmlFor="whatsapp-message" className="text-sm font-semibold text-foreground">
            Mensagem livre
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            Disponível após o template abrir a conversa e sujeita à janela de atendimento do WhatsApp.
          </p>
          <textarea
            id="whatsapp-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4096}
            rows={4}
            placeholder="Digite a mensagem para o usuário"
            className="mt-4 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{message.length}/4096</span>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void handleMessage()}
              disabled={sendCommunication.isPending || !phone || !message.trim()}
            >
              <Send className="h-4 w-4" />
              Enviar mensagem
            </Button>
          </div>
        </section>
      </div>

      {feedback && (
        <p role="status" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
          {feedback}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <h3 className="text-sm font-semibold text-foreground">Histórico de envios</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Os horários abaixo usam o fuso de Salvador.
          </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleCheckDelivery}
            disabled={isChecking || communications.isFetching}
            aria-busy={isChecking}
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checando..." : "Checar envio"}
          </Button>
        </div>
        {checkFeedback && <p role="status" className="text-sm text-muted-foreground">{checkFeedback}</p>}

        {communications.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando comunicações...</p>
        ) : communications.isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>
        ) : communications.data?.length ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="divide-y divide-border">
              {communications.data.map((communication) => (
                <article key={communication.id} className="grid gap-3 bg-background p-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {communication.status === "sent" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : communication.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="text-sm font-semibold text-foreground">
                        {communication.message_type === "template"
                          ? `Template: ${communication.template_name}`
                          : "Mensagem livre"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {STATUS_LABELS[communication.status]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {communication.body_text || communication.subject}
                    </p>
                    {communication.status === "failed" && communication.last_error && (
                      <p className="mt-2 text-xs text-destructive">Falha: {communication.last_error}</p>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs md:min-w-64">
                    <dt className="text-muted-foreground">Solicitado em</dt>
                    <dd className="text-right text-foreground">{formatDate(communication.created_at)}</dd>
                    <dt className="text-muted-foreground">Enviado em</dt>
                    <dd className="text-right text-foreground">{formatDate(communication.sent_at)}</dd>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma comunicação por WhatsApp registrada.
          </p>
        )}
      </section>
    </div>
  );
}
