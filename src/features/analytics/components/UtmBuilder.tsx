"use client";

import { useRef, useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import type { AnalyticsSource } from "@/features/analytics/types/analytics";

const destinations: Record<AnalyticsSource, string> = {
  site: "https://escolaveli.com",
  student: "https://aluno.escolaveli.com",
};

const origins = ["Instagram", "campanha", "story"];

export function UtmBuilder({ source }: { source: AnalyticsSource }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  let generatedUrl = "";
  if (origin.trim()) {
    const url = new URL(destinations[source]);
    url.searchParams.set("utm_source", origin.trim());
    generatedUrl = url.toString();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => {
        setCopyState("idle");
        dialog.current?.showModal();
      }}>
        <Link2 className="size-4" /> Criar UTM
      </Button>
      <dialog ref={dialog} aria-labelledby="utm-title" aria-describedby="utm-description" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 id="utm-title" className="text-lg font-semibold">Construtor de UTM</h2>
          <Button type="button" variant="ghost" size="sm" aria-label="Fechar construtor de UTM" onClick={() => dialog.current?.close()}><X className="size-4" /></Button>
        </div>
        <p id="utm-description" className="mt-2 text-sm text-muted-foreground">Crie um link para identificar a origem dos acessos {source === "site" ? "ao site da Veli" : "ao portal do aluno"}.</p>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="utm-origin" className="text-sm font-medium">Origem</label>
            <Input id="utm-origin" placeholder="Digite a origem do acesso" value={origin} onChange={(event) => { setOrigin(event.target.value); setCopyState("idle"); }} />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Origens predefinidas">
              {origins.map((item) => <Button key={item} type="button" size="sm" variant={origin === item.toLowerCase() ? "default" : "outline"} aria-pressed={origin === item.toLowerCase()} onClick={() => { setOrigin(item.toLowerCase()); setCopyState("idle"); }}>{item}</Button>)}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="utm-result" className="text-sm font-medium">Link gerado</label>
            <Input id="utm-result" readOnly value={generatedUrl} placeholder="Digite ou selecione a origem" onFocus={(event) => event.target.select()} />
          </div>
          <Button type="button" className="w-full" disabled={!generatedUrl} onClick={copyLink}>
            {copyState === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copyState === "copied" ? "Link copiado" : "Copiar link"}
          </Button>
          <p role="status" className="text-xs text-muted-foreground">{copyState === "failed" ? "Não foi possível copiar. Selecione o link gerado e copie manualmente." : copyState === "copied" ? "Link copiado para a área de transferência." : ""}</p>
        </div>
      </dialog>
    </>
  );
}
