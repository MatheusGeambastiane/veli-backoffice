"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Clock3, Menu, MessageSquareText, Plus, Sparkles, X } from "lucide-react";
import {
  useAssistantConversations,
  useAssistantMessages,
  useCreateAssistantConversation,
  useSendAssistantMessage,
} from "@/features/assistant/queries/assistantQueries";
import type { AssistantConversation, AssistantMessage } from "@/features/assistant/types/assistant";
import { HttpError } from "@/shared/lib/http/http";
import { Topbar } from "@/shared/components/layout/Topbar";

const suggestions = [
  {
    title: "Resumo da operação",
    prompt: "Faça um resumo dos principais números da Veli hoje.",
  },
  {
    title: "Matrículas",
    prompt: "Quantas matrículas temos e como estão distribuídas?",
  },
  {
    title: "Turmas ativas",
    prompt: "Quais turmas estão ativas no momento?",
  },
  {
    title: "Ofertas",
    prompt: "Liste as ofertas ativas e seus principais dados.",
  },
] as const;

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError && error.details && typeof error.details === "object") {
    const detail = (error.details as { detail?: string }).detail;
    if (detail) return detail;
  }
  return "Não consegui responder agora. Tente novamente em instantes.";
}

function getConversationTitle(conversation: AssistantConversation) {
  const title = conversation.title?.trim();
  return title || "Nova conversa";
}

function Message({ message }: { message: AssistantMessage }) {
  const isAssistant = message.role === "assistant";

  if (!isAssistant) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[84%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm leading-6 text-background sm:max-w-[72%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
        <Image src="/herminho_headset.png" alt="" fill sizes="28px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Herminho</span>
          <span className="text-xs text-muted-foreground">Assistente Veli</span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export function AssistantPage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversations = useAssistantConversations(true);
  const messages = useAssistantMessages(activeConversationId, true);
  const createConversation = useCreateAssistantConversation();
  const sendMessage = useSendAssistantMessage();
  const isBusy = createConversation.isPending || sendMessage.isPending;

  useEffect(() => {
    if (activeConversationId === null && conversations.data?.results.length) {
      setActiveConversationId(conversations.data.results[0].id);
    }
  }, [activeConversationId, conversations.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.data, pendingMessage, isBusy]);

  async function submit(content: string) {
    const normalized = content.trim();
    if (!normalized || isBusy) return;

    setDraft("");
    setPendingMessage(normalized);
    try {
      let conversationId = activeConversationId;
      if (conversationId === null) {
        const created = await createConversation.mutateAsync();
        conversationId = created.id;
        setActiveConversationId(created.id);
      }
      await sendMessage.mutateAsync({ id: conversationId, content: normalized });
    } catch {
      // Mutation errors are rendered in the conversation area.
    } finally {
      setPendingMessage("");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(draft);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(draft);
    }
  }

  async function startNewConversation() {
    if (isBusy) return;
    try {
      const created = await createConversation.mutateAsync();
      setActiveConversationId(created.id);
      setDraft("");
      setIsHistoryOpen(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      // Mutation errors are rendered in the conversation area.
    }
  }

  function selectConversation(id: number) {
    setActiveConversationId(id);
    setIsHistoryOpen(false);
  }

  const hasMessages = Boolean(messages.data?.length || pendingMessage);
  const visibleError = sendMessage.error ?? createConversation.error ?? messages.error;

  return (
    <div className="flex h-dvh min-w-0 flex-col bg-background" data-assistant-page>
      <Topbar variant="assistant" />
      <section className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-card">
        <aside
          className={[
            "absolute inset-y-0 left-0 z-30 flex w-[300px] flex-col border-r border-border bg-card p-3 transition-transform duration-200 lg:static lg:w-[320px] lg:translate-x-0",
            isHistoryOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em]">Conversas</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Seu histórico recente</p>
            </div>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Fechar histórico"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void startNewConversation()}
            disabled={isBusy}
            className="mt-2 flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-85 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova conversa
          </button>

          <div className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {conversations.isLoading && (
              <p className="px-3 py-4 text-xs text-muted-foreground">Carregando histórico...</p>
            )}
            {conversations.data?.results.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={[
                    "group flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  ].join(" ")}
                >
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {getConversationTitle(conversation)}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs opacity-65">
                      <Clock3 className="h-2.5 w-2.5" />
                      {timeFormatter.format(new Date(conversation.updated_at))}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mx-2 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
              </span>
              Conectado aos dados da Veli
            </div>
          </div>
        </aside>

        {isHistoryOpen && (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setIsHistoryOpen(false)}
            aria-label="Fechar histórico"
          />
        )}

        <div className="relative flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
                aria-label="Abrir histórico"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-muted-foreground">Conversas</span>
            </div>
            <button
              type="button"
              onClick={() => void startNewConversation()}
              disabled={isBusy}
              className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
            <div className="mx-auto flex min-h-full w-full max-w-none flex-col px-5 sm:w-[92%] sm:px-8 lg:w-[90%] lg:px-10">
              {messages.isLoading && activeConversationId !== null && (
                <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                  Carregando conversa...
                </div>
              )}

              {!messages.isLoading && !hasMessages && (
                <div className="assistant-content-enter flex flex-1 flex-col justify-center py-12">
                  <div className="mb-7 flex items-center gap-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-md border border-border bg-white">
                      <Image
                        src="/herminho_headset.png"
                        alt="Herminho, assistente virtual da Veli"
                        fill
                        priority
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex h-6 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      IA da Veli
                    </div>
                  </div>
                  <h2 className="max-w-[620px] text-[clamp(2rem,5vw,3.35rem)] font-semibold leading-[1.03] tracking-[-0.055em] text-foreground">
                    Como posso ajudar hoje?
                  </h2>
                  <p className="mt-4 max-w-[560px] text-sm leading-6 text-muted-foreground">
                    Pergunte sobre a operação em linguagem natural. Eu consulto matrículas, turmas,
                    alunos, ofertas e indicadores para você.
                  </p>
                  <div className="mt-9 grid gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => void submit(suggestion.prompt)}
                        className="group flex min-h-20 flex-col items-start justify-between rounded-lg border border-border/80 bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.025]"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {suggestion.title}
                        </span>
                        <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {suggestion.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasMessages && (
                <div className="space-y-8 py-8 sm:py-10">
                  {messages.data?.map((message) => (
                    <Message key={message.id} message={message} />
                  ))}
                  {pendingMessage && (
                    <div className="flex justify-end">
                      <div className="max-w-[84%] rounded-2xl rounded-br-md bg-foreground px-4 py-3 text-sm leading-6 text-background opacity-60 sm:max-w-[72%]">
                        {pendingMessage}
                      </div>
                    </div>
                  )}
                  {isBusy && (
                    <div
                      className="flex items-center gap-3"
                      role="status"
                      aria-label="Assistente pensando"
                    >
                      <div className="relative h-7 w-7 overflow-hidden rounded-lg border border-border bg-white">
                        <Image
                          src="/herminho_headset.png"
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="assistant-thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}

              {visibleError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                  {getErrorMessage(visibleError)}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:pb-5 sm:pt-4">
            <form onSubmit={onSubmit} className="mx-auto w-full max-w-none sm:w-[92%] lg:w-[90%]">
              <div className="rounded-xl border border-input bg-card p-2 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.45)] transition focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/5">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  rows={1}
                  maxLength={4000}
                  placeholder="Pergunte qualquer coisa sobre a Veli..."
                  className="max-h-32 min-h-11 w-full resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/70"
                  aria-label="Mensagem para o assistente"
                />
                <div className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-xs text-muted-foreground">
                    Enter para enviar. Shift + Enter para nova linha.
                  </span>
                  <button
                    type="submit"
                    disabled={!draft.trim() || isBusy}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    aria-label="Enviar mensagem"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground">
                O assistente pode cometer erros. Confirme informações importantes antes de tomar
                decisões.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
