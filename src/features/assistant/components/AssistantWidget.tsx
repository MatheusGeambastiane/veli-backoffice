"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Minus, Plus } from "lucide-react";
import {
  useAssistantConversations,
  useAssistantMessages,
  useCreateAssistantConversation,
  useSendAssistantMessage,
} from "@/features/assistant/queries/assistantQueries";
import type { AssistantMessage } from "@/features/assistant/types/assistant";
import { HttpError } from "@/shared/lib/http/http";

const suggestions = [
  "Quantas matrículas temos?",
  "Quais turmas estão ativas?",
  "Liste as ofertas ativas",
];

function errorMessage(error: unknown) {
  if (error instanceof HttpError && error.details && typeof error.details === "object") {
    const detail = (error.details as { detail?: string }).detail;
    if (detail) return detail;
  }
  return "Não consegui responder agora. Tente novamente em instantes.";
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[88%] whitespace-pre-wrap rounded-[20px] px-4 py-3 text-[13px] leading-relaxed shadow-sm",
          isAssistant
            ? "rounded-bl-md border border-border bg-card text-card-foreground"
            : "rounded-br-md bg-primary text-primary-foreground",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversations = useAssistantConversations(isOpen);
  const messages = useAssistantMessages(activeConversationId, isOpen);
  const createConversation = useCreateAssistantConversation();
  const sendMessage = useSendAssistantMessage();
  const isBusy = createConversation.isPending || sendMessage.isPending;

  useEffect(() => {
    if (activeConversationId === null && conversations.data?.results.length) {
      setActiveConversationId(conversations.data.results[0].id);
    }
  }, [activeConversationId, conversations.data]);

  useEffect(() => {
    if (isOpen) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(focusTimer);
    }
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.data, pendingMessage, isBusy]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

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
    const created = await createConversation.mutateAsync();
    setActiveConversationId(created.id);
    setDraft("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  const hasMessages = Boolean(messages.data?.length || pendingMessage);
  const visibleError = sendMessage.error ?? createConversation.error ?? messages.error;

  return (
    <>
      {isOpen && (
        <section
          role="dialog"
          aria-label="Assistente Veli"
          className="assistant-panel-enter fixed inset-x-3 bottom-28 z-50 flex h-[min(690px,calc(100dvh-9rem))] flex-col overflow-hidden rounded-[28px] border border-border bg-background text-foreground shadow-[0_28px_90px_-28px_rgba(5,24,52,0.62)] sm:left-auto sm:right-5 sm:w-[410px] lg:bottom-24"
        >
          <header className="relative overflow-hidden bg-primary px-5 pb-5 pt-4 text-primary-foreground">
            <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border border-[#f2a35b]/30" />
            <div className="relative flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/20 bg-white">
                <Image
                  src="/herminho_headset.png"
                  alt="Herminho com headset"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold tracking-[-0.01em]">Herminho</h2>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.15)]" />
                </div>
                <p className="mt-0.5 text-xs text-blue-100/70">Seu assistente da Veli</p>
              </div>
              <button
                type="button"
                onClick={() => void startNewConversation()}
                disabled={isBusy}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-blue-50 transition hover:bg-white/15 disabled:opacity-40"
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-100/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Minimizar assistente"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:thin]">
            {messages.isLoading && (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Carregando conversa...
              </div>
            )}

            {!messages.isLoading && !hasMessages && (
              <div className="flex min-h-full flex-col justify-center px-2 py-6">
                <Image
                  src="/herminho_completo.png"
                  alt="Herminho, assistente virtual da Veli"
                  width={408}
                  height={612}
                  priority
                  className="mb-3 h-36 w-auto self-center object-contain"
                />
                <h3 className="max-w-[290px] text-2xl font-semibold leading-tight tracking-[-0.035em] text-foreground">
                  O que você quer saber sobre a Veli hoje?
                </h3>
                <p className="mt-3 max-w-[330px] text-sm leading-relaxed text-muted-foreground">
                  Consulte matrículas, alunos, turmas, horários e ofertas usando linguagem natural.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void submit(suggestion)}
                      className="rounded-full border border-border bg-card px-3.5 py-2 text-left text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasMessages && (
              <div className="space-y-3.5">
                {messages.data?.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {pendingMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-[20px] rounded-br-md bg-primary px-4 py-3 text-[13px] leading-relaxed text-primary-foreground opacity-70">
                      {pendingMessage}
                    </div>
                  </div>
                )}
                {isBusy && (
                  <div className="flex justify-start" role="status" aria-label="Assistente pensando">
                    <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-md border border-border bg-card px-4 py-3">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="assistant-thinking-dot h-1.5 w-1.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}

            {visibleError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {errorMessage(visibleError)}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-border bg-background/90 p-3.5 backdrop-blur">
            <div className="flex items-end gap-2 rounded-[22px] border border-input bg-card p-2 shadow-[0_8px_30px_-22px_rgba(15,23,42,0.5)] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onInputKeyDown}
                rows={1}
                maxLength={4000}
                placeholder="Pergunte sobre matrículas, turmas..."
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Mensagem para o assistente"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isBusy}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                aria-label="Enviar mensagem"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              O assistente consulta dados, mas não faz alterações nesta versão.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "fixed right-4 z-50 flex items-center justify-center shadow-[0_18px_45px_-16px_rgba(8,31,65,0.75)] transition duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:right-5 lg:bottom-5",
          isOpen
            ? "bottom-6 rounded-full border border-primary/20 bg-primary p-2.5 hover:bg-primary/90"
            : "bottom-28 h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary bg-white p-0 lg:bottom-5",
        ].join(" ")}
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente Veli"}
        aria-expanded={isOpen}
      >
        <span
          className={[
            "relative overflow-hidden bg-white",
            isOpen
              ? "h-10 w-10 rounded-full border-2 border-white/35"
              : "h-full w-full rounded-[14px]",
          ].join(" ")}
        >
          <Image
            src="/herminho_headset.png"
            alt=""
            fill
            sizes={isOpen ? "40px" : "64px"}
            className="object-cover"
          />
        </span>
      </button>
    </>
  );
}
