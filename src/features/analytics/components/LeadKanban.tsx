"use client";

import { useState } from "react";
import { GripVertical, Loader2, Send, X } from "lucide-react";
import { useLeadColumn, useUpdatePlacementLead } from "@/features/analytics/queries/analyticsQueries";
import { leadStages, type LeadStage, type PlacementLeadFilters } from "@/features/analytics/types/placementLeads";
import { Button } from "@/shared/components/ui/button";
import { LeadBulkCommunicationModal, LeadBulkCommunicationProgress } from "@/features/analytics/components/LeadBulkCommunication";

type ColumnProps = {
  stage: typeof leadStages[number]; search: string; filters: PlacementLeadFilters; busy: boolean;
  onOpen: (id: number) => void; onMove: (id: number, stage: LeadStage) => void;
  selectedIds: Set<number>; onToggle: (id: number) => void; onToggleMany: (ids: number[]) => void;
};

function LeadColumn({ stage, search, filters, busy, onOpen, onMove, selectedIds, onToggle, onToggleMany }: ColumnProps) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeadColumn(search, stage.value, filters);
  const [over, setOver] = useState(false);
  const leads = data?.pages.flatMap((page) => page.results) ?? [];
  const allLoadedSelected = leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id));
  return (
    <section aria-label={stage.label} onDragOver={(event) => { if (!busy && event.dataTransfer.types.includes("application/x-veli-lead")) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(true); } }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
      onDrop={(event) => { event.preventDefault(); setOver(false); const id = Number(event.dataTransfer.getData("application/x-veli-lead")); const sourceStage = event.dataTransfer.getData("application/x-veli-lead-stage"); if (!busy && sourceStage !== stage.value && Number.isInteger(id) && id > 0) onMove(id, stage.value); }}
      className={`min-w-0 rounded-xl border border-t-4 ${stage.color} ${over ? "border-primary bg-primary/10 ring-2 ring-primary/25" : "border-border bg-muted/25"}`}>
      <header className="flex items-center justify-between gap-2 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={allLoadedSelected} disabled={!leads.length} onChange={() => onToggleMany(leads.map((lead) => lead.id))} aria-label={`Selecionar leads carregados em ${stage.label}`} className="size-4 rounded border-input accent-primary" />{stage.label}</label><span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold tabular-nums">{data?.pages[0].count ?? "—"}</span></header>
      <div className="space-y-3 px-3 pb-3">
        {isLoading ? <p role="status" className="p-5 text-sm text-muted-foreground">Carregando…</p> : isError ? <div role="alert" className="p-3 text-sm"><p>Não foi possível carregar esta etapa.</p><Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button></div> : null}
        {leads.map((lead) => (
          <article key={lead.id} draggable={!busy} onDragStart={(event) => { event.dataTransfer.setData("application/x-veli-lead", String(lead.id)); event.dataTransfer.setData("application/x-veli-lead-stage", lead.stage); event.dataTransfer.effectAllowed = "move"; }} className={`rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md ${selectedIds.has(lead.id) ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-start gap-2"><input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => onToggle(lead.id)} aria-label={`Selecionar ${lead.name}`} className="mt-1 size-4 shrink-0 rounded border-input accent-primary" /><button onClick={() => onOpen(lead.id)} className="min-w-0 text-left font-semibold hover:text-primary focus-visible:outline-primary"><span className="block break-words">{lead.name}</span></button></div><GripVertical aria-hidden="true" className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground" /></div>
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

export function LeadKanban({ search, filters, onOpen }: { search: string; filters: PlacementLeadFilters; onOpen: (id: number) => void }) {
  const mutation = useUpdatePlacementLead();
  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  function move(id: number, stage: LeadStage) {
    setNotice("");
    mutation.mutate({ id, stage }, { onSuccess: () => setNotice(`Lead movido para ${leadStages.find((item) => item.value === stage)?.label}.`) });
  }
  function toggle(id: number) {
    setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleMany(ids: number[]) {
    setSelectedIds((current) => { const next = new Set(current); const shouldSelect = ids.some((id) => !next.has(id)); for (const id of ids) { if (shouldSelect) next.add(id); else next.delete(id); } return next; });
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Arraste os cartões entre as etapas ou selecione leads para uma comunicação em lote.</p>{selectedIds.size ? <div className="flex items-center gap-2"><span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span><Button size="sm" onClick={() => setIsBulkModalOpen(true)}><Send className="size-4" />Enviar comunicação</Button><Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} aria-label="Limpar seleção"><X className="size-4" /></Button></div> : null}</div>
    {activeCampaignId !== null ? <LeadBulkCommunicationProgress campaignId={activeCampaignId} onDismiss={() => setActiveCampaignId(null)} /> : null}
    <div role="status" aria-live="polite" className="text-sm">{mutation.isPending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Salvando etapa…</span> : notice}</div>
    {mutation.isError ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Não foi possível mover o lead. A etapa anterior foi mantida. Tente novamente.</p> : null}
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">{leadStages.map((stage) => <LeadColumn key={stage.value} stage={stage} search={search} filters={filters} busy={mutation.isPending} onOpen={onOpen} onMove={move} selectedIds={selectedIds} onToggle={toggle} onToggleMany={toggleMany} />)}</div>
    {isBulkModalOpen ? <LeadBulkCommunicationModal leadIds={[...selectedIds]} onClose={() => setIsBulkModalOpen(false)} onCreated={(campaignId) => { setActiveCampaignId(campaignId); setIsBulkModalOpen(false); setSelectedIds(new Set()); }} /> : null}
  </div>;
}
