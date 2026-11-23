"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Columns3, List, ArrowLeft, ArrowRight, Check, Clipboard, Loader2, Search, Settings2, UserRoundSearch } from "lucide-react";
import { LeadKanban } from "@/features/analytics/components/LeadKanban";
import { leadStages } from "@/features/analytics/types/placementLeads";
import { PlacementLeadDrawer } from "@/features/analytics/components/PlacementLeadDrawer";
import { useDashboardLanguages, useLeadSummary, usePlacementLeads } from "@/features/analytics/queries/analyticsQueries";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { PageHeader } from "@/shared/components/ui/page";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

export function PlacementLeadsPage() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<"" | "true" | "false">("");
  const [testStatus, setTestStatus] = useState<"" | "started" | "completed">("");
  const languages = useDashboardLanguages();
  const filters = { language, estimated_level: level, has_purchased: purchaseStatus, status: testStatus };
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, error } = usePlacementLeads(page, deferredSearch, filters);

  const summary = useLeadSummary(deferredSearch, filters);

  async function copyPhone(phone: string) {
    await navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/analytics" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar para Analytics</Link>
          <PageHeader title="Leads do teste de nível" description="Acompanhe diagnóstico, contato comercial, compra e matrícula em um só lugar." />
        </div>
        <Link href="/analytics/tests" className={buttonVariants()}><Settings2 className="size-4" /> Gerenciar testes</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[{ label: "Total de leads", value: summary.data?.total }, ...leadStages.map((stage) => ({ label: stage.label, value: summary.data?.stages[stage.value] })), { label: "Taxa de sucesso", value: summary.data ? `${summary.data.success_rate.toLocaleString("pt-BR")}%` : undefined }].map((item) => <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{summary.isError ? "—" : item.value ?? "—"}</p></CardContent></Card>)}
      </div>
      <p className="text-xs text-muted-foreground">Taxa de sucesso = contratados ÷ total de leads. Os indicadores consideram todos os contatos encontrados na busca e nos filtros do último teste.</p>
      {summary.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar os indicadores. <button className="underline" onClick={() => void summary.refetch()}>Tentar novamente</button></p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar leads" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome, telefone ou e-mail" className="pl-9" /></div>
        <div className="flex gap-2" role="group" aria-label="Visualização de leads"><Button variant={view === "list" ? "default" : "outline"} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="size-4" />Lista</Button><Button variant={view === "kanban" ? "default" : "outline"} aria-pressed={view === "kanban"} onClick={() => setView("kanban")}><Columns3 className="size-4" />Kanban</Button></div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm sm:flex-none">
          Idioma do teste
          <select value={language} disabled={languages.isLoading || languages.isError} onChange={(event) => { setLanguage(event.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{languages.isLoading ? "Carregando idiomas…" : "Todos os idiomas"}</option>
            {languages.data?.results.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm sm:flex-none">
          Nível do teste
          <select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os níveis</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm sm:flex-none">
          Situação da compra
          <select value={purchaseStatus} onChange={(event) => { setPurchaseStatus(event.target.value as "" | "true" | "false"); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os leads</option>
            <option value="true">Já comprou</option>
            <option value="false">Ainda não comprou</option>
          </select>
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm sm:flex-none">
          Situação do teste
          <select value={testStatus} onChange={(event) => { setTestStatus(event.target.value as "" | "started" | "completed"); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os leads</option>
            <option value="completed">Completou o teste</option>
            <option value="started">Não completou o teste</option>
          </select>
        </label>
        {language || level || purchaseStatus || testStatus ? <Button variant="outline" onClick={() => { setLanguage(""); setLevel(""); setPurchaseStatus(""); setTestStatus(""); setPage(1); }}>Limpar filtros</Button> : null}
      </div>
      {languages.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar os idiomas. <button className="underline" onClick={() => void languages.refetch()}>Tentar novamente</button></p> : null}
      {view === "kanban" ? <LeadKanban search={deferredSearch} filters={filters} onOpen={setSelectedLead} /> : <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading && !data ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : error ? <div className="p-10 text-center text-sm text-destructive">Não foi possível carregar os leads.</div> : data?.results.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-muted/35 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Lead</th><th className="px-5 py-3 font-medium">Último teste</th><th className="px-5 py-3 font-medium">Telefone</th><th className="px-5 py-3 font-medium">Etapa comercial</th><th className="px-5 py-3 font-medium">Contratação</th><th className="px-5 py-3 text-right font-medium">Entrada</th></tr></thead><tbody className="divide-y divide-border">{data.results.map((lead) => (
            <tr key={lead.id} role="button" tabIndex={0} onClick={() => setSelectedLead(lead.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedLead(lead.id); }} className="cursor-pointer transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
              <td className="px-5 py-4"><p className="font-semibold">{lead.name}</p><p className="mt-1 text-xs text-muted-foreground">{lead.tests_count} {lead.tests_count === 1 ? "teste realizado" : "testes realizados"}</p></td>
              <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">{lead.estimated_level || "…"}</span><span><span className="block font-medium">{lead.language_name}</span><span className="text-xs text-muted-foreground">{lead.answers_count}/{lead.max_questions} respostas</span></span></div></td>
              <td className="px-5 py-4"><button type="button" onClick={(event) => { event.stopPropagation(); void copyPhone(lead.phone); }} className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-medium hover:bg-muted" title="Copiar telefone">{copiedPhone === lead.phone ? <Check className="size-4 text-emerald-600" /> : <Clipboard className="size-4 text-muted-foreground" />}{lead.phone}</button></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.is_contacted ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{leadStages.find((stage) => stage.value === lead.stage)?.label}</span></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.has_purchased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{lead.has_purchased ? "Contratou" : "Não contratou"}</span></td>
              <td className="px-5 py-4 text-right text-xs text-muted-foreground">{formatDate(lead.started_at)}</td>
            </tr>
          ))}</tbody></table></div> : <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center"><UserRoundSearch className="size-9 text-muted-foreground" /><p className="font-medium">Nenhum lead encontrado</p><p className="text-sm text-muted-foreground">Nenhum contato corresponde à busca e aos filtros selecionados.</p></div>}
        </CardContent>
      </Card>

      {data && data.count > 15 ? <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Página {page} de {Math.ceil(data.count / 15)}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft className="size-4" /> Anterior</Button><Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((current) => current + 1)}>Próxima <ArrowRight className="size-4" /></Button></div></div> : null}

      </>}
      {selectedLead !== null ? <PlacementLeadDrawer leadId={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </div>
  );
}
