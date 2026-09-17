"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  Clock3,
  Eye,
  Loader2,
  MousePointerClick,
  Route,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalytics } from "@/features/analytics/queries/analyticsQueries";
import type { AnalyticsError, AnalyticsPeriod, AnalyticsSource, RankedItem } from "@/features/analytics/types/analytics";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/ui/page";

const number = new Intl.NumberFormat("pt-BR");
const periods: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "1 semana" },
  { value: "30d", label: "30 dias" },
];

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}min ${rest}s`;
}

function RankList({ items, empty = "Sem dados no período" }: { items: RankedItem[]; empty?: string }) {
  const max = Math.max(...items.map((item) => item.total), 1);
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
            <span className="truncate font-medium" title={item.label}>{item.label}</span>
            <span className="tabular-nums text-muted-foreground">{number.format(item.total)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorDetails({ error, onClose }: { error: AnalyticsError; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-foreground/20 backdrop-blur-[2px]" onClick={onClose}>
      <aside className="h-[92dvh] w-full overflow-y-auto border-l border-border bg-card p-6 shadow-2xl sm:max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">Diagnóstico do erro</p>
            <h2 className="mt-2 text-xl font-semibold">{error.message || "Falha na aplicação"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(error.occurred_at).toLocaleString("pt-BR")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button>
        </div>
        <dl className="mt-6 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Página</dt><dd className="mt-1 break-all font-medium">{error.path || "-"}</dd></div>
          <div><dt className="text-muted-foreground">Aluno</dt><dd className="mt-1 font-medium">{error.user || "Não identificado"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Endpoint</dt><dd className="mt-1 break-all font-mono text-xs">{[error.http_method, error.endpoint, error.http_status].filter(Boolean).join(" · ") || "-"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Sessão</dt><dd className="mt-1 break-all font-mono text-xs">{error.session_id}</dd></div>
        </dl>
        <section className="mt-6"><h3 className="text-sm font-semibold">Inputs do formulário</h3><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">{JSON.stringify(error.form_inputs, null, 2) || "{}"}</pre></section>
        <section className="mt-6"><h3 className="text-sm font-semibold">Log e stack trace</h3><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">{error.stack || JSON.stringify(error.metadata, null, 2) || "Log não informado"}</pre></section>
      </aside>
    </div>
  );
}

export function AnalyticsPage() {
  const [source, setSource] = useState<AnalyticsSource>("site");
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [selectedError, setSelectedError] = useState<AnalyticsError | null>(null);
  const { data, isLoading, error } = useAnalytics(source, period);
  const stats = data?.big_numbers;
  const cards = [
    { label: "Acessos", value: stats ? number.format(stats.total_accesses) : "-", icon: Eye },
    { label: source === "student" ? "Alunos ativos" : "Sessões", value: stats ? number.format(source === "student" ? stats.unique_users : stats.unique_sessions) : "-", icon: source === "student" ? UserRound : UsersRound },
    { label: "Tempo médio", value: stats ? formatDuration(stats.average_duration_seconds) : "-", icon: Clock3 },
    { label: "Cliques para contratar", value: stats ? number.format(stats.offer_clicks) : "-", icon: MousePointerClick },
    { label: "Conversão", value: stats ? `${stats.conversion_rate.toLocaleString("pt-BR")}%` : "-", icon: Route },
    { label: "Erros", value: stats ? number.format(stats.errors) : "-", icon: AlertTriangle, danger: Boolean(stats?.errors) },
  ];

  const histogram = data?.histogram.map((item) => ({
    ...item,
    label: new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
  })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Comportamento, aquisição, conversão e estabilidade dos produtos Veli." />
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 rounded-md bg-muted p-1">
          {(["site", "student"] as const).map((item) => (
            <button key={item} onClick={() => setSource(item)} className={`rounded px-4 py-2 text-sm font-medium transition-colors ${source === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {item === "site" ? "Site" : "Aluno"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {periods.map((item) => <Button key={item.value} size="sm" variant={period === item.value ? "default" : "ghost"} onClick={() => setPeriod(item.value)}>{item.label}</Button>)}
        </div>
      </div>

      {isLoading && !data ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div> : error ? <Card className="border-destructive/30"><CardContent className="pt-6 text-sm text-destructive">Não foi possível carregar o Analytics.</CardContent></Card> : data ? <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map((card) => { const Icon = card.icon; return <Card key={card.label} className={card.danger ? "border-destructive/30" : ""}><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{card.label}</span><Icon className={`size-4 ${card.danger ? "text-destructive" : "text-primary"}`} /></div><p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{card.value}</p></CardContent></Card>; })}
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Acessos por dia</CardTitle></CardHeader>
          <CardContent className="h-72 pl-1 sm:pl-4">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={histogram} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.35} /><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} /><Tooltip cursor={{ fill: "hsl(var(--muted))" }} formatter={(value) => [number.format(Number(value)), "Acessos"]} /><Bar dataKey="accesses" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={44} /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-base">Páginas mais visitadas</CardTitle></CardHeader><CardContent><RankList items={data.top_pages} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">{source === "student" ? "Aulas mais visitadas" : "Origens de acesso"}</CardTitle></CardHeader><CardContent><RankList items={source === "student" ? data.top_lessons : data.origins.map((item) => ({ label: item.origin, total: item.total }))} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">{source === "student" ? "Ofertas mais visitadas" : "Ofertas visualizadas"}</CardTitle></CardHeader><CardContent><RankList items={data.top_offers} /></CardContent></Card>
        </div>

        {source === "student" ? <Card><CardHeader><CardTitle className="text-base">Alunos com mais acessos</CardTitle></CardHeader><CardContent><RankList items={data.top_students.map((item) => ({ label: item.name, total: item.total }))} /></CardContent></Card> : <Card><CardHeader><CardTitle className="text-base">Funil de contratação</CardTitle></CardHeader><CardContent><div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{data.funnel.map((step, index) => <div key={step.step} className="relative rounded-lg border border-border bg-muted/25 p-4"><p className="text-xs font-medium text-muted-foreground">{index + 1}. {step.label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{number.format(step.total)}</p>{step.dropoff > 0 ? <p className="mt-2 flex items-center gap-1 text-xs text-destructive"><ArrowDownRight className="size-3.5" />{number.format(step.dropoff)} pararam</p> : <p className="mt-2 text-xs text-muted-foreground">Sem abandono</p>}</div>)}</div></CardContent></Card>}

        {source === "site" ? <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Teste de nível e conversão dos leads</CardTitle><Link href="/analytics/leads" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium transition hover:bg-accent">Ver todos os leads</Link></CardHeader><CardContent className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
          ["Iniciaram", data.placement_test.started],
          ["Informaram contato", data.placement_test.leads],
          ["Concluíram", data.placement_test.completed],
          ["Abandonaram", data.placement_test.abandoned_after_lead],
          ["Compraram", data.placement_test.converted],
        ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-border bg-muted/25 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{number.format(Number(value))}</p></div>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="pb-3 font-medium">Lead</th><th className="pb-3 font-medium">Idioma / nível</th><th className="pb-3 font-medium">Progresso</th><th className="pb-3 font-medium">Entrada</th><th className="pb-3 text-right font-medium">Conversão</th></tr></thead><tbody className="divide-y divide-border">{data.placement_test.recent_leads.map((lead) => <tr key={lead.id}><td className="py-3"><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.phone}</p></td><td className="py-3">{lead.language} · {lead.level || "Em avaliação"}</td><td className="py-3">{lead.questions_answered}/{lead.max_questions}</td><td className="py-3 text-muted-foreground">{new Date(lead.started_at).toLocaleString("pt-BR")}</td><td className="py-3 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${lead.has_purchased ? "bg-emerald-100 text-emerald-800" : lead.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{lead.has_purchased ? "Comprou" : lead.status === "completed" ? "Concluiu" : "Em andamento"}</span></td></tr>)}</tbody></table>{!data.placement_test.recent_leads.length ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lead captado no período.</p> : null}</div></CardContent></Card> : null}

        <Card>
          <CardHeader><CardTitle className="text-base">Erros recentes</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0"><div className="divide-y divide-border">{data.errors.length ? data.errors.map((item) => <button key={item.event_id} className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50" onClick={() => setSelectedError(item)}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.message || `Erro ${item.http_status ?? "de rede"}`}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.path} {item.endpoint ? `· ${item.endpoint}` : ""}</span></span><span className="hidden text-xs text-muted-foreground sm:block">{new Date(item.occurred_at).toLocaleString("pt-BR")}</span></button>) : <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhum erro registrado no período.</p>}</div></CardContent>
        </Card>
      </> : null}
      {selectedError ? <ErrorDetails error={selectedError} onClose={() => setSelectedError(null)} /> : null}
    </div>
  );
}
