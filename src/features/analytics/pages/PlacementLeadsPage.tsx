"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clipboard, Loader2, Search, Settings2, UserRoundSearch } from "lucide-react";
import { PlacementLeadDrawer } from "@/features/analytics/components/PlacementLeadDrawer";
import { usePlacementLeads } from "@/features/analytics/queries/analyticsQueries";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { PageHeader } from "@/shared/components/ui/page";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

export function PlacementLeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, error } = usePlacementLeads(page, deferredSearch);

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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Contatos encontrados</p><p className="mt-2 text-3xl font-semibold tabular-nums">{data?.count ?? "—"}</p></CardContent></Card>
        <Card className="sm:col-span-2"><CardContent className="flex h-full items-center p-4"><div className="relative w-full"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome, telefone ou e-mail" className="pl-9" /></div></CardContent></Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading && !data ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : error ? <div className="p-10 text-center text-sm text-destructive">Não foi possível carregar os leads.</div> : data?.results.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-muted/35 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Lead</th><th className="px-5 py-3 font-medium">Último teste</th><th className="px-5 py-3 font-medium">Telefone</th><th className="px-5 py-3 font-medium">Contato</th><th className="px-5 py-3 font-medium">Contratação</th><th className="px-5 py-3 text-right font-medium">Entrada</th></tr></thead><tbody className="divide-y divide-border">{data.results.map((lead) => (
            <tr key={lead.id} role="button" tabIndex={0} onClick={() => setSelectedLead(lead.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedLead(lead.id); }} className="cursor-pointer transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
              <td className="px-5 py-4"><p className="font-semibold">{lead.name}</p><p className="mt-1 text-xs text-muted-foreground">{lead.tests_count} {lead.tests_count === 1 ? "teste realizado" : "testes realizados"}</p></td>
              <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">{lead.estimated_level || "…"}</span><span><span className="block font-medium">{lead.language_name}</span><span className="text-xs text-muted-foreground">{lead.answers_count}/{lead.max_questions} respostas</span></span></div></td>
              <td className="px-5 py-4"><button type="button" onClick={(event) => { event.stopPropagation(); void copyPhone(lead.phone); }} className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-medium hover:bg-muted" title="Copiar telefone">{copiedPhone === lead.phone ? <Check className="size-4 text-emerald-600" /> : <Clipboard className="size-4 text-muted-foreground" />}{lead.phone}</button></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.is_contacted ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{lead.is_contacted ? "Contatado" : "Pendente"}</span></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lead.has_purchased ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{lead.has_purchased ? "Contratou" : "Não contratou"}</span></td>
              <td className="px-5 py-4 text-right text-xs text-muted-foreground">{formatDate(lead.started_at)}</td>
            </tr>
          ))}</tbody></table></div> : <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center"><UserRoundSearch className="size-9 text-muted-foreground" /><p className="font-medium">Nenhum lead encontrado</p><p className="text-sm text-muted-foreground">Os contatos aparecem aqui assim que iniciarem o teste.</p></div>}
        </CardContent>
      </Card>

      {data && data.count > 15 ? <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Página {page} de {Math.ceil(data.count / 15)}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft className="size-4" /> Anterior</Button><Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((current) => current + 1)}>Próxima <ArrowRight className="size-4" /></Button></div></div> : null}

      {selectedLead !== null ? <PlacementLeadDrawer leadId={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </div>
  );
}
