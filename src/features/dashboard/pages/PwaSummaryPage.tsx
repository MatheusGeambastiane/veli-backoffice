"use client";

import Image from "next/image";
import Link from "next/link";
import { GraduationCap, RefreshCw, ShoppingCart } from "lucide-react";
import { useDashboardSummary } from "@/features/dashboard/queries/dashboardQueries";
import { useOrdersList } from "@/features/orders/queries/ordersQueries";

const countFormatter = new Intl.NumberFormat("pt-BR");
const updatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PwaSummaryPage() {
  const students = useDashboardSummary();
  const orders = useOrdersList({ page: 1, pageSize: 1 });
  const isLoading = students.isPending || orders.isPending;
  const isFetching = students.isFetching || orders.isFetching;
  const hasError = students.isError || orders.isError;
  const updatedAt = Math.max(students.dataUpdatedAt, orders.dataUpdatedAt);

  function refresh() {
    void Promise.all([students.refetch(), orders.refetch()]);
  }

  return (
    <main className="min-h-[100dvh] bg-[#070b14] px-4 py-[max(1.5rem,env(safe-area-inset-top))] text-slate-50 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400">
            <Image
              src="/icons/icon-192.png"
              alt="Veli"
              width={48}
              height={48}
              className="rounded-xl"
              priority
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Veli</p>
              <h1 className="text-lg font-semibold">Resumo rápido</h1>
            </div>
          </Link>
          <button
            type="button"
            onClick={refresh}
            disabled={isFetching}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            aria-label="Atualizar resumo"
          >
            <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </header>

        <section aria-busy={isLoading} className="grid gap-4 sm:grid-cols-2">
          <SummaryMetric
            href="/orders"
            label="Total de pedidos"
            value={isLoading ? "…" : countFormatter.format(orders.data?.count ?? 0)}
            icon={<ShoppingCart className="h-6 w-6" />}
            accent="from-blue-500/20 to-cyan-400/5"
          />
          <SummaryMetric
            href="/"
            label="Alunos ativos"
            value={isLoading ? "…" : countFormatter.format(students.data?.total_active_students ?? 0)}
            icon={<GraduationCap className="h-6 w-6" />}
            accent="from-indigo-500/20 to-violet-400/5"
          />
        </section>

        {hasError ? (
          <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            Não foi possível atualizar todos os dados. Verifique a conexão e tente novamente.
          </p>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>{updatedAt ? `Atualizado em ${updatedAtFormatter.format(updatedAt)}` : "Carregando dados…"}</span>
          <Link href="/" className="font-medium text-blue-300 hover:text-blue-200">
            Abrir painel completo
          </Link>
        </footer>
      </div>
    </main>
  );
}

function SummaryMetric({
  href,
  label,
  value,
  icon,
  accent,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group min-h-48 rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-6 shadow-2xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-white/20`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-blue-100">
        {icon}
      </div>
      <p className="mt-8 text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
    </Link>
  );
}
