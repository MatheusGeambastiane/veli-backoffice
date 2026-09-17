"use client";

import { useDeferredValue, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, Loader2, Plus, Search, TicketPercent, X } from "lucide-react";
import {
  useCouponOffers,
  useCoupons,
  useCreateCoupon,
  useToggleCoupon,
} from "@/features/coupons/queries/couponsQueries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DataSurface, PageHeader, PageStat } from "@/shared/components/ui/page";

const initialForm = {
  code: "",
  offer: "",
  maxUsage: "1",
  discountType: "percent" as "fixed" | "percent",
  discountValue: "",
  startsAt: "",
  endsAt: "",
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CouponsPage() {
  const createDialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(
    null,
  );
  const deferredSearch = useDeferredValue(search.trim());
  const coupons = useCoupons(deferredSearch);
  const offers = useCouponOffers();
  const createCoupon = useCreateCoupon();
  const toggleCoupon = useToggleCoupon();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.offer || !form.code.trim() || !form.discountValue || Number(form.maxUsage) < 1) {
      setFeedback({ kind: "error", message: "Preencha os campos obrigatórios do cupom." });
      return;
    }
    try {
      await createCoupon.mutateAsync({
        code: form.code.trim().toUpperCase(),
        offer: Number(form.offer),
        max_usage: Number(form.maxUsage),
        discount_type: form.discountType,
        discount_value: form.discountValue,
        is_active: true,
        starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      });
      setForm(initialForm);
      setFeedback({ kind: "success", message: "Cupom criado com sucesso." });
      createDialog.current?.close();
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível criar o cupom. Revise os dados informados.",
      });
    }
  }

  const items = coupons.data?.results ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cupons"
        description="Crie descontos por oferta e acompanhe o consumo de cada código."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PageStat label="Cadastrados" value={coupons.data?.count ?? 0} />
            <Button
              onClick={() => {
                setFeedback(null);
                createDialog.current?.showModal();
              }}
            >
              <Plus className="size-4" />
              Adicionar cupom
            </Button>
          </div>
        }
      />

      {feedback?.kind === "success" ? (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback.message}
        </p>
      ) : null}

      <dialog
        ref={createDialog}
        aria-labelledby="create-coupon-title"
        aria-describedby="create-coupon-description"
        onCancel={(event) => {
          if (createCoupon.isPending) event.preventDefault();
        }}
        onClose={() => {
          setForm(initialForm);
          setFeedback((current) => (current?.kind === "error" ? null : current));
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 text-foreground shadow-xl backdrop:bg-black/50 sm:p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 border-b border-border/70 pb-4">
            <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
              <Plus className="size-5" />
            </span>
            <div>
              <h2 id="create-coupon-title" className="font-semibold">
                Adicionar cupom
              </h2>
              <p id="create-coupon-description" className="text-xs text-muted-foreground">
                Defina a oferta e a regra do desconto.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto shrink-0"
              aria-label="Fechar"
              disabled={createCoupon.isPending}
              onClick={() => createDialog.current?.close()}
            >
              <X className="size-4" />
            </Button>
          </div>

          <Field label="Código">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="EX.: VELI20"
              required
            />
          </Field>
          <Field label="Oferta">
            <select
              value={form.offer}
              onChange={(e) => setForm({ ...form, offer: e.target.value })}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione uma oferta</option>
              {(offers.data?.results ?? []).map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as "fixed" | "percent" })
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="percent">Porcentagem</option>
                <option value="fixed">Valor em reais</option>
              </select>
            </Field>
            <Field label={form.discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}>
              <Input
                type="number"
                min="0.01"
                max={form.discountType === "percent" ? "100" : undefined}
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Quantidade de usos">
            <Input
              type="number"
              min="1"
              value={form.maxUsage}
              onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início (opcional)">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
            <Field label="Fim (opcional)">
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={createCoupon.isPending}
              onClick={() => createDialog.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCoupon.isPending}>
              {createCoupon.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <TicketPercent className="size-4" />
              )}{" "}
              Criar cupom
            </Button>
          </div>
          {feedback?.kind === "error" ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {feedback.message}
            </p>
          ) : null}
        </form>
      </dialog>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou oferta"
            className="h-11 bg-card pl-9"
          />
        </div>
        <DataSurface>
          <div className="hidden grid-cols-[1fr_1.4fr_.8fr_.8fr_auto] gap-4 border-b bg-muted/20 px-6 py-3 text-xs text-muted-foreground md:grid">
            <span>Código</span>
            <span>Oferta</span>
            <span>Desconto</span>
            <span>Utilização</span>
            <span>Status</span>
          </div>
          {coupons.isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Carregando cupons...</div>
          ) : null}
          {coupons.isError ? (
            <div className="p-8 text-sm text-destructive">Erro ao carregar cupons.</div>
          ) : null}
          {!coupons.isLoading && !coupons.isError && items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum cupom encontrado.
            </div>
          ) : null}
          <ul className="divide-y divide-border/70">
            {items.map((coupon) => {
              const percent = Math.min(
                100,
                Math.round((coupon.used_count / coupon.max_usage) * 100),
              );
              return (
                <li
                  key={coupon.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1.4fr_.8fr_.8fr_auto] md:items-center"
                >
                  <div>
                    <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-sm font-semibold text-primary">
                      {coupon.code}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{coupon.offer_name}</p>
                  <p className="text-sm">
                    {coupon.discount_type === "percent"
                      ? `${Number(coupon.discount_value)}%`
                      : money.format(Number(coupon.discount_value))}
                  </p>
                  <div className="min-w-28">
                    <div className="flex justify-between text-xs">
                      <span>
                        {coupon.used_count} de {coupon.max_usage}
                      </span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={coupon.is_active ? "outline" : "secondary"}
                    disabled={toggleCoupon.isPending}
                    onClick={() =>
                      toggleCoupon.mutate({ id: coupon.id, is_active: !coupon.is_active })
                    }
                  >
                    {coupon.is_active ? (
                      <>
                        <Check className="size-3.5" />
                        Ativo
                      </>
                    ) : (
                      "Inativo"
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </DataSurface>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
