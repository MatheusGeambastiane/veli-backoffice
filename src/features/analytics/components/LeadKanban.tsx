"use client";

import { useState } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { useLeadColumn, useUpdatePlacementLead } from "@/features/analytics/queries/analyticsQueries";
import { leadStages, type LeadStage } from "@/features/analytics/types/placementLeads";
import { Button } from "@/shared/components/ui/button";

type ColumnProps = {
  stage: typeof leadStages[number]; search: string; busy: boolean;
  onOpen: (id: number) => void; onMove: (id: number, stage: LeadStage) => void;
};

function LeadColumn({ stage, search, busy, onOpen, onMove }: ColumnProps) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeadColumn(search, stage.value);
  const [over, setOver] = useState(false);
  return (
    <section aria-label={stage.label} onDragOver={(event) => { if (!busy && event.dataTransfer.types.includes("application/x-veli-lead")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(true); } }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
      onDrop={(event) => { event.preventDefault(); setOver(false); const id = Number(event.dataTransfer.getData("application/x-veli-lead")); if (!busy && Number.isInteger(id) && id > 0) onMove(id, stage.value); }}
      className={`min-w-0 rounded-xl border border-t-4 ${stage.color} ${over ? "border-primary bg-primary/10 ring-2 ring-primary/25" : "border-border bg-muted/25"}`}>
      <header className="flex items-center justify-between gap-2 p-4"><h2 className="text-sm font-semibold">{stage.label}</h2><span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold tabular-nums">{data?.pages[0].count ?? "—"}</span></header>
      <div className="space-y-3 px-3 pb-3">
        {isLoading ? <p role="status" className="p-5 text-sm text-muted-foreground">Carregando…</p> : isError ? <div role="alert" className="p-3 text-sm"><p>Não foi possível carregar esta etapa.</p><Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button></div> : null}
        {data?.pages.flatMap((page) => page.results).map((lead) => (
          <article key={lead.id} draggable={!busy} onDragStart={(event) => { event.dataTransfer.setData("application/x-veli-lead", String(lead.id)); event.dataTransfer.effectAllowed = "move"; }} className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2"><button onClick={() => onOpen(lead.id)} className="min-w-0 text-left font-semibold hover:text-primary focus-visible:outline-primary"><span className="block break-words">{lead.name}</span></button><GripVertical aria-hidden="true" className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground" /></div>
            <p className="mt-2 text-xs text-muted-foreground">{lead.phone}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{lead.email || "Sem e-mail"}</p>
            <div className="my-4 flex flex-wrap gap-2 text-xs"><span className="rounded bg-primary/10 px-2 py-1 text-primary">{lead.language_name} · {lead.estimated_level || "Em teste"}</span><span className="rounded bg-muted px-2 py-1">{lead.tests_count} teste(s)</span></div>
            <label className="block text-xs text-muted-foreground">Mover {lead.name} para
              <select aria-label={`Etapa de ${lead.name}`} value={lead.stage} disabled={busy} onChange={(event) => onMove(lead.id, event.target.value as LeadStage)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground">
                {leadStages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <button className="mt-3 text-xs font-medium text-primary hover:underline" onClick={() => onOpen(lead.id)}>Ver detalhes</button>
          </article>
        ))}
        {data?.pages[0].count === 0 ? <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">Nenhum lead nesta etapa.<br />Arraste um cartão para cá.</p> : null}
        {hasNextPage ? <Button variant="outline" className="w-full" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>{isFetchingNextPage ? "Carregando…" : "Carregar mais"}</Button> : null}
      </div>
    </section>
  );
}

export function LeadKanban({ search, onOpen }: { search: string; onOpen: (id: number) => void }) {
  const mutation = useUpdatePlacementLead();
  const [notice, setNotice] = useState("");
  function move(id: number, stage: LeadStage) {
    setNotice("");
    mutation.mutate({ id, stage }, { onSuccess: () => setNotice(`Lead movido para ${leadStages.find((item) => item.value === stage)?.label}.`) });
  }
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Arraste os cartões entre as etapas ou use o seletor de cada lead.</p>
    <div role="status" aria-live="polite" className="text-sm">{mutation.isPending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Salvando etapa…</span> : notice}</div>
    {mutation.isError ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Não foi possível mover o lead. A etapa anterior foi mantida. Tente novamente.</p> : null}
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">{leadStages.map((stage) => <LeadColumn key={stage.value} stage={stage} search={search} busy={mutation.isPending} onOpen={onOpen} onMove={move} />)}</div>
  </div>;
}
