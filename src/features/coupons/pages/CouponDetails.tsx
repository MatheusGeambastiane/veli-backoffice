"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Pencil } from "lucide-react";
import { useCouponDetail, useCouponUsage } from "@/features/coupons/queries/couponsQueries";
import type { Coupon } from "@/features/coupons/types/coupon";
import { Button } from "@/shared/components/ui/button";
import { DataSurface, PageHeader, PageStat } from "@/shared/components/ui/page";

export function CouponDetails({ id, onEdit }: { id: number; onEdit: (coupon: Coupon) => void }) {
  const [page, setPage] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState("");
  const coupon = useCouponDetail(id);
  const usage = useCouponUsage(id, page);
  const data = coupon.data;

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback(`Código ${code} copiado.`);
    } catch {
      setCopyFeedback("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <>
      <Link href="/coupons" className="text-sm text-primary hover:underline">
        Voltar para cupons
      </Link>
      {coupon.isError ? (
        <p role="alert">
          Não foi possível carregar o cupom.{" "}
          <Button variant="ghost" onClick={() => coupon.refetch()}>
            Tentar novamente
          </Button>
        </p>
      ) : !data ? (
        <p role="status">Carregando cupom…</p>
      ) : (
        <>
          <PageHeader
            title={data.code}
            description={[
              data.is_active ? "Ativo" : "Inativo",
              data.discount_type === "percent"
                ? `${Number(data.discount_value)}% de desconto`
                : `${Number(data.discount_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`,
            ].join(" · ")}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyCode(data.code)}>
                  <Copy />
                  Copiar código
                </Button>
                <Button onClick={() => onEdit(data)}>
                  <Pencil />
                  Editar cupom
                </Button>
              </div>
            }
          />
          {copyFeedback && (
            <p role="status" className="text-sm">
              {copyFeedback}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <PageStat label="Total de usos" value={data.used_count} />
            <PageStat label="Limite de usos" value={data.max_usage} />
          </div>
          <section className="space-y-3">
            <h2 className="font-semibold">Uso por oferta</h2>
            <DataSurface>
              <ul className="divide-y">
                {data.usage_by_offer.map((offer) => (
                  <li key={offer.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span>{offer.name}</span>
                    <span className="whitespace-nowrap tabular-nums">
                      {offer.uses} {offer.uses === 1 ? "uso" : "usos"}
                    </span>
                  </li>
                ))}
              </ul>
              {!data.usage_by_offer.length && <p className="p-4">Nenhuma oferta vinculada.</p>}
            </DataSurface>
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Pedidos que usaram o cupom</h2>
            <DataSurface>
              {usage.isError ? (
                <p className="p-4" role="alert">
                  Não foi possível carregar o histórico.{" "}
                  <Button variant="ghost" onClick={() => usage.refetch()}>
                    Tentar novamente
                  </Button>
                </p>
              ) : !usage.data ? (
                <p className="p-4" role="status">
                  Carregando histórico…
                </p>
              ) : usage.data.results.length === 0 ? (
                <p className="p-4">Nenhum uso registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="p-3">Pedido</th>
                        <th className="p-3">Oferta</th>
                        <th className="p-3">Data de uso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usage.data.results.map((row) => (
                        <tr key={row.id}>
                          <td className="p-3">
                            {row.order_number ? (
                              <Link
                                className="font-medium text-primary underline"
                                href={`/orders/${row.order_number}?returnTo=${encodeURIComponent(`/coupons/${id}`)}`}
                              >
                                #{row.order_number}
                              </Link>
                            ) : (
                              `Fatura #${row.invoice_id} (sem pedido)`
                            )}
                          </td>
                          <td className="p-3">{row.offer_name}</td>
                          <td className="whitespace-nowrap p-3">
                            {new Date(row.used_at).toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataSurface>
            {usage.data && (page > 1 || usage.data.next) && (
              <div className="flex items-center justify-end gap-3 text-sm">
                <Button
                  variant="outline"
                  disabled={!usage.data.previous}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                Página {page}
                <Button
                  variant="outline"
                  disabled={!usage.data.next}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
