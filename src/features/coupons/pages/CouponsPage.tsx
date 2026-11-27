"use client";

import Link from "next/link";
import { CouponDetails } from "./CouponDetails";
import { useDeferredValue, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, Loader2, Pencil, Plus, Search, TicketPercent, X } from "lucide-react";
import {
  useCouponOffers,
  useCoupons,
  useCreateCoupon,
  useToggleCoupon,
  useUpdateCoupon,
} from "@/features/coupons/queries/couponsQueries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DataSurface, PageHeader, PageStat } from "@/shared/components/ui/page";
import type { Coupon, CouponPayload } from "@/features/coupons/types/coupon";

const initialForm = {
  code: "",
  offers: [] as number[],
  maxUsage: "1",
  discountType: "percent" as "fixed" | "percent",
  discountValue: "",
  startsAt: "",
  endsAt: "",
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function couponOfferIds(coupon: Coupon) {
  return coupon.offers ?? (coupon.offer ? [coupon.offer] : []);
}

export function CouponsPage({ couponId }: { couponId?: number }) {
  const createDialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [offerSearch, setOfferSearch] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(
    null,
  );
  const deferredSearch = useDeferredValue(search.trim());
  const coupons = useCoupons(deferredSearch, couponId === undefined);
  const offers = useCouponOffers();
  const createCoupon = useCreateCoupon();
  const toggleCoupon = useToggleCoupon();
  const updateCoupon = useUpdateCoupon();
  const isSaving = createCoupon.isPending || updateCoupon.isPending;
  const availableOffers = new Map(
    (offers.data?.results ?? []).map((offer) => [offer.id, { id: offer.id, name: offer.name }]),
  );
  // Preserve selected offers even if they are absent from the options response.
  if (editingCoupon) {
    couponOfferIds(editingCoupon).forEach((id, index) => {
      if (!availableOffers.has(id)) {
        availableOffers.set(id, {
          id,
          name: editingCoupon.offer_names?.[index] ?? editingCoupon.offer_name ?? `Oferta #${id}`,
        });
      }
    });
  }
  const visibleOffers = [...availableOffers.values()].filter((offer) =>
    offer.name.toLocaleLowerCase("pt-BR").includes(offerSearch.trim().toLocaleLowerCase("pt-BR")),
  );

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setFeedback(null);
    setOfferSearch("");
    setForm({
      code: coupon.code,
      offers: [...couponOfferIds(coupon)],
      maxUsage: String(coupon.max_usage),
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      startsAt: localDateTime(coupon.starts_at),
      endsAt: localDateTime(coupon.ends_at),
    });
    createDialog.current?.showModal();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (form.offers.length === 0) {
      setFeedback({ kind: "error", message: "Selecione pelo menos uma oferta." });
      return;
    }
    if (!form.code.trim() || !form.discountValue || Number(form.maxUsage) < 1) {
      setFeedback({ kind: "error", message: "Preencha os campos obrigatórios do cupom." });
      return;
    }
    try {
      const payload: CouponPayload = {
        code: form.code.trim().toUpperCase(),
        offers: form.offers,
        max_usage: Number(form.maxUsage),
        discount_type: form.discountType,
        discount_value: form.discountValue,
        is_active: editingCoupon?.is_active ?? true,
        starts_at:
          editingCoupon && form.startsAt === localDateTime(editingCoupon.starts_at)
            ? editingCoupon.starts_at
            : form.startsAt
              ? new Date(form.startsAt).toISOString()
              : null,
        ends_at:
          editingCoupon && form.endsAt === localDateTime(editingCoupon.ends_at)
            ? editingCoupon.ends_at
            : form.endsAt
              ? new Date(form.endsAt).toISOString()
              : null,
      };
      if (editingCoupon) {
        await updateCoupon.mutateAsync({ id: editingCoupon.id, payload });
      } else {
        await createCoupon.mutateAsync(payload);
      }
      setForm(initialForm);
      setFeedback({
        kind: "success",
        message: editingCoupon ? "Cupom atualizado com sucesso." : "Cupom criado com sucesso.",
      });
      createDialog.current?.close();
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível salvar o cupom. Revise os dados informados.",
      });
    }
  }

  const items = coupons.data?.results ?? [];

  return (
    <section className="space-y-6">
      {couponId ? <CouponDetails id={couponId} onEdit={openEdit} /> : <PageHeader
        title="Cupons"
        description="Crie descontos por oferta e acompanhe o consumo de cada código."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PageStat label="Cadastrados" value={coupons.data?.count ?? 0} />
            <Button
              onClick={() => {
                setFeedback(null);
                setEditingCoupon(null);
                setForm(initialForm);
                setOfferSearch("");
                createDialog.current?.showModal();
              }}
            >
              <Plus className="size-4" />
              Adicionar cupom
            </Button>
          </div>
        }
      />}

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
          if (isSaving) event.preventDefault();
        }}
        onClose={() => {
          setForm(initialForm);
          setEditingCoupon(null);
          setOfferSearch("");
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
                {editingCoupon ? "Editar cupom" : "Adicionar cupom"}
              </h2>
              <p id="create-coupon-description" className="text-xs text-muted-foreground">
                Selecione uma ou mais ofertas e defina a regra do desconto.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto shrink-0"
              aria-label="Fechar"
              disabled={isSaving}
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
          <fieldset className="space-y-2" disabled={isSaving}>
            <legend className="text-sm font-medium">Ofertas</legend>
            <Input
              aria-label="Buscar ofertas"
              placeholder="Buscar ofertas"
              value={offerSearch}
              onChange={(event) => setOfferSearch(event.target.value)}
            />
            <div className="max-h-48 overflow-y-auto rounded-md border border-input p-2">
              {offers.isPending ? (
                <p role="status" className="p-2 text-sm">
                  Carregando ofertas...
                </p>
              ) : null}
              {offers.isError ? (
                <div role="alert" className="p-2 text-sm text-destructive">
                  Não foi possível carregar as ofertas.
                  <Button type="button" variant="ghost" onClick={() => offers.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : null}
              {visibleOffers.map((offer) => (
                <label
                  key={offer.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.offers.includes(offer.id)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((current) => ({
                        ...current,
                        offers: checked
                          ? [...current.offers, offer.id]
                          : current.offers.filter((id) => id !== offer.id),
                      }));
                    }}
                  />
                  {offer.name}
                </label>
              ))}
              {!offers.isPending && !offers.isError && visibleOffers.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Nenhuma oferta encontrada.</p>
              ) : null}
            </div>
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {form.offers.length} selecionada(s). Selecione pelo menos uma oferta.
            </p>
          </fieldset>
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
              min={Math.max(1, editingCoupon?.used_count ?? 0)}
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
              disabled={isSaving}
              onClick={() => createDialog.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || offers.isPending || offers.isError}>
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <TicketPercent className="size-4" />
              )}{" "}
              {editingCoupon ? "Salvar alterações" : "Criar cupom"}
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

      {!couponId && <div className="space-y-4">
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
            <span>Ofertas</span>
            <span>Desconto</span>
            <span>Utilização</span>
            <span>Ações</span>
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
                    <Link href={`/coupons/${coupon.id}`} className="hover:underline rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-sm font-semibold text-primary">
                      {coupon.code}
                    </Link>
                  </div>
                  <p className="text-sm font-medium">
                    {(coupon.offer_names ?? (coupon.offer_name ? [coupon.offer_name] : [])).join(
                      ", ",
                    ) || "Sem ofertas"}
                  </p>
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isSaving || toggleCoupon.isPending}
                      onClick={() => openEdit(coupon)}
                      aria-label={`Editar cupom ${coupon.code}`}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={coupon.is_active ? "outline" : "secondary"}
                      disabled={toggleCoupon.isPending || isSaving}
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
                  </div>
                </li>
              );
            })}
          </ul>
        </DataSurface>
      </div>}
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
