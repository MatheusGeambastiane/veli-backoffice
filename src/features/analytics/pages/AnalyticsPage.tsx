"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  Clock3,
  Check,
  Copy,
  Eye,
  Loader2,
  MousePointerClick,
  Route,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalytics, useReviewAnalyticsError, useReviewAllAnalyticsErrors } from "@/features/analytics/queries/analyticsQueries";
import { useIsMutating } from "@tanstack/react-query";
import type { AnalyticsError, AnalyticsPeriod, AnalyticsSource, RankedItem } from "@/features/analytics/types/analytics";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/ui/page";

import { UtmBuilder } from "@/features/analytics/components/UtmBuilder";

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

function errorName(error: AnalyticsError) {
  return error.message || `Erro ${error.http_status ?? "de rede"}`;
}

function ErrorActions({ error }: { error: AnalyticsError }) {
  const review = useReviewAnalyticsError();
  const saving = useIsMutating({ mutationKey: ["review-analytics-error"] }) > 0;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyName() {
    try {
      await navigator.clipboard.writeText(errorName(error));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm" title={error.seen_at ? `Visto em ${new Date(error.seen_at).toLocaleString("pt-BR")}` : "Marcar como visto"}>
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={Boolean(error.is_seen)}
          disabled={saving}
          aria-label={`Visto: ${errorName(error)}`}
          onChange={(event) => review.mutate({ eventId: error.event_id, isSeen: event.target.checked })}
        />
        Visto
      </label>
      <Button type="button" variant="ghost" size="sm" onClick={copyName} aria-label="Copiar nome do erro" title="Copiar nome do erro">
        {copyState === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
      <span role="status" className="text-xs text-muted-foreground">{copyState === "copied" ? "Copiado" : copyState === "failed" ? "Não foi possível copiar. Selecione e copie o texto." : ""}</span>
      {review.isError ? <p role="alert" className="w-full text-xs text-destructive">Não foi possível salvar a marcação. Tente novamente.</p> : null}
    </div>
  );
}

function ReviewAllErrors({ errors }: { errors: AnalyticsError[] }) {
  const review = useReviewAllAnalyticsErrors();
  const saving = useIsMutating({ mutationKey: ["review-analytics-error"] }) > 0;
  const unseenIds = errors.filter((error) => !error.is_seen).map((error) => error.event_id);
  if (!errors.some((error) => error.is_seen)) return null;

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" variant="outline" disabled={saving || !unseenIds.length} onClick={() => review.mutate(unseenIds)} title="Marcar todos os erros exibidos nesta lista como vistos">
        {review.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        {review.isPending ? "Salvando..." : "Selecionar todos como visto"}
      </Button>
      {review.isError ? <p role="alert" className="text-xs text-destructive">Não foi possível marcar todos. Tente novamente para salvar os restantes.</p> : null}
      {review.isSuccess ? <p role="status" className="text-xs text-muted-foreground">Todos os erros da lista foram marcados como vistos.</p> : null}
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
            <h2 className="mt-2 text-xl font-semibold">{errorName(error)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(error.occurred_at).toLocaleString("pt-BR")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button>
        </div>
        <div className="mt-4"><ErrorActions error={error} /></div>
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
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const { data, isLoading, error } = useAnalytics(source, period);
  const selectedError = data?.errors.find((item) => item.event_id === selectedErrorId);
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
          <Card><CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><CardTitle className="text-base">{source === "student" ? "Aulas mais visitadas" : "Origens de acesso"}</CardTitle><UtmBuilder key={source} source={source} /></CardHeader><CardContent><RankList items={source === "student" ? data.top_lessons : data.origins.map((item) => ({ label: item.origin, total: item.total }))} /></CardContent></Card>
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
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><CardTitle className="text-base">Erros recentes</CardTitle><ReviewAllErrors key={`${source}-${period}`} errors={data.errors} /></CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="max-h-96 overflow-y-auto overscroll-contain divide-y divide-border" role="region" aria-label="Lista de erros recentes" tabIndex={0}>
              {data.errors.length ? data.errors.map((item) => (
                <div key={item.event_id} className="flex flex-wrap items-center gap-x-4 px-6 py-4 hover:bg-muted/50">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-4 py-2 text-left" onClick={() => setSelectedErrorId(item.event_id)}>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.is_seen ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
                      {item.is_seen ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{errorName(item)}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{item.path} {item.endpoint ? `· ${item.endpoint}` : ""}</span>
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">{new Date(item.occurred_at).toLocaleString("pt-BR")}</span>
                  </button>
                  <ErrorActions error={item} />
                </div>
              )) : <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhum erro registrado no período.</p>}
            </div>
          </CardContent>
        </Card>
      </> : null}
      {selectedError ? <ErrorDetails key={selectedError.event_id} error={selectedError} onClose={() => setSelectedErrorId(null)} /> : null}
    </div>
  );
}
