"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offersApi } from "@/features/offers/api/offersApi";
import { usersApi } from "@/features/users/api/usersApi";
import type { DashboardUser } from "@/features/users/types/dashboardUser";
import { ordersApi } from "@/features/orders/api/ordersApi";
import { ordersKeys } from "@/features/orders/queries/ordersQueries";
import { HttpError } from "@/shared/lib/http/http";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { X } from "lucide-react";

function paymentMethodLabel(code: string) {
  if (code === "UPFRONT_CREDIT_CARD") return "Valor total cartão de crédito";
  if (code === "UPFRONT_PIX") return "Valor total pix";
  return code;
}

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const selectClass = "h-11 w-full rounded-md border border-border bg-background px-3 text-sm";

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpError && error.details && typeof error.details === "object") {
    return Object.entries(error.details)
      .filter(([key]) => key !== "order_id")
      .map(([, value]) => (Array.isArray(value) ? value.join(" ") : String(value)))
      .join(" ");
  }
  return "Não foi possível criar o pedido. Tente novamente.";
}

export function CreateOrderDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const cache = useQueryClient();
  const requestId = useRef<string | null>(null);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerId, setOfferId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [gateway, setGateway] = useState("");
  const [discounted, setDiscounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const debouncedSearch = useDebounced(search);
  const debouncedOffer = useDebounced(offerSearch);
  const offers = useQuery({
    queryKey: ["order-offers", debouncedOffer],
    queryFn: () => offersApi.list({ name: debouncedOffer, pageSize: 100 }),
  });
  const offer = useQuery({
    queryKey: ["order-offer", offerId],
    queryFn: () => offersApi.details(offerId),
    enabled: Boolean(offerId),
  });
  const users = useQuery({
    queryKey: ["order-users", debouncedSearch],
    queryFn: () => usersApi.listDashboard({ search: debouncedSearch, page: 1, pageSize: 20 }),
    enabled: debouncedSearch.length >= 2 && !user,
  });
  const gateways = useQuery({ queryKey: ["order-gateways"], queryFn: ordersApi.checkoutGateways });
  const options =
    offer.data?.billing_options.filter(
      (item) => item.type === "one_time" && item.is_active !== false,
    ) ?? [];
  const option = options.find((item) => String(item.id) === optionId);
  const original = Number(option?.price ?? 0);
  const finalAmount = discounted ? Number(amount) : original;
  const valid = Boolean(
    user &&
    option &&
    gateway &&
    finalAmount > 0 &&
    finalAmount <= original &&
    offer.data?.is_active,
  );
  const create = useMutation({
    mutationFn: ordersApi.createCheckout,
    onError: (error) => {
      if (error instanceof HttpError && error.status === 400) {
        setSubmitted(false);
        requestId.current = null;
      }
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(create.data!.checkout_url);
      setCopyMessage("Link copiado.");
    } catch {
      setCopyMessage("Selecione o link abaixo para copiá-lo manualmente.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-order-title"
      aria-describedby="create-order-description"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground shadow-2xl backdrop:bg-black/50 sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        if (!create.isPending) onClose();
      }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 id="create-order-title" className="text-xl font-semibold">
            Novo pedido
          </h2>
          <p id="create-order-description" className="mt-2 text-sm text-muted-foreground">
            Selecione a oferta e o aluno para gerar um link de pagamento externo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-10 shrink-0 p-0"
          onClick={onClose}
          disabled={create.isPending}
          aria-label="Fechar novo pedido"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {create.data ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6" role="status">
          <h2 className="text-lg font-semibold">Pedido #{create.data.order_id} criado</h2>
          <p className="text-sm text-muted-foreground">
            Aguardando pagamento de {money(finalAmount)} via{" "}
            {gateway === "stripe" ? "Stripe" : "AbacatePay"}. Compartilhe o link com o aluno.
          </p>
          <Input
            aria-label="Link de pagamento"
            readOnly
            value={create.data.checkout_url}
            onFocus={(event) => event.target.select()}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={copyLink}>
              Copiar link
            </Button>
            <a
              href={create.data.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              Abrir checkout
            </a>
            <Link
              href={`/orders/${create.data.order_id}`}
              className="text-sm text-primary underline"
            >
              Ver pedido
            </Link>
          </div>
          {copyMessage && <p className="text-sm">{copyMessage}</p>}
        </div>
      ) : (
        <form
          className="space-y-6 rounded-lg border border-border bg-card p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid || create.isPending) return;
            requestId.current ??= crypto.randomUUID();
            setSubmitted(true);
            create.mutate({
              request_id: requestId.current,
              user: user!.id,
              offer: Number(offerId),
              billing_option: Number(optionId),
              amount_due: finalAmount.toFixed(2),
              gateway_choice: gateway,
            });
          }}
        >
          <fieldset disabled={submitted} className="space-y-5 disabled:opacity-70">
            <div className="space-y-2">
              <label htmlFor="offer-search" className="text-sm font-medium">
                Buscar oferta
              </label>
              <Input
                id="offer-search"
                value={offerSearch}
                onChange={(event) => setOfferSearch(event.target.value)}
                placeholder="Nome da oferta"
              />
              <label htmlFor="offer" className="block text-sm font-medium">
                Oferta
              </label>
              <select
                id="offer"
                required
                className={selectClass}
                value={offerId}
                onChange={(event) => {
                  setOfferId(event.target.value);
                  setOptionId("");
                  setDiscounted(false);
                  setAmount("");
                }}
              >
                <option value="">
                  {offers.isFetching ? "Buscando ofertas…" : "Selecione a oferta"}
                </option>
                {offers.data?.results.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {(offers.isError || offer.isError) && (
                <p role="alert" className="text-sm text-destructive">
                  Não foi possível carregar as ofertas.
                </p>
              )}
              {offerId && offer.isFetching && (
                <p className="text-sm">Carregando formas de pagamento…</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="condition" className="text-sm font-medium">
                Forma de pagamento
              </label>
              <select
                id="condition"
                required
                className={selectClass}
                value={optionId}
                onChange={(event) => {
                  setOptionId(event.target.value);
                  setDiscounted(false);
                  setAmount("");
                }}
              >
                <option value="">Selecione a forma de pagamento</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {paymentMethodLabel(item.code)} · {money(Number(item.price))}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Cobrança única, sem renovação automática.
              </p>
              {offer.data && !options.length && (
                <p className="text-sm text-destructive">
                  Esta oferta não possui forma de pagamento ativa de cobrança única.
                </p>
              )}
              {offer.data && !offer.data.is_active && (
                <p className="text-sm text-destructive">Esta oferta está inativa.</p>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={discounted}
                  onChange={(event) => setDiscounted(event.target.checked)}
                />
                Aplicar desconto
              </label>
              {discounted && (
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Valor final a pagar (R$)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    max={original}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              )}
              <p className="text-sm">
                Original: {money(original)} · Desconto: {money(Math.max(0, original - finalAmount))}
              </p>
              <p className="font-semibold">Total a pagar: {money(finalAmount)}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="user-search" className="text-sm font-medium">
                Usuário associado
              </label>
              {user ? (
                <div className="flex items-center justify-between gap-4 rounded-md bg-muted p-3 text-sm">
                  <span>
                    {user.first_name} {user.last_name}
                    <br />
                    {user.email}
                    <br />
                    {user.phone}
                  </span>
                  <Button type="button" variant="outline" onClick={() => setUser(null)}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="user-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nome, e-mail, telefone ou CPF"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite pelo menos 2 caracteres. Refine a busca se necessário.
                  </p>
                  {users.isFetching && (
                    <p role="status" className="text-sm">
                      Buscando usuários…
                    </p>
                  )}
                  {users.isError && (
                    <p role="alert" className="text-sm text-destructive">
                      Erro ao buscar usuários.
                    </p>
                  )}
                  {debouncedSearch === search.trim() && users.data && (
                    <ul className="max-h-64 overflow-auto divide-y divide-border rounded-md border border-border">
                      {users.data.results.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="w-full p-3 text-left text-sm hover:bg-muted focus:bg-muted"
                            onClick={() => setUser(item)}
                          >
                            {item.first_name} {item.last_name}
                            <span className="block text-muted-foreground">
                              {item.email} · {item.phone || "Sem telefone"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {users.data?.count === 0 && <p className="text-sm">Nenhum usuário encontrado.</p>}
                </>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="gateway" className="text-sm font-medium">
                Gateway
              </label>
              <select
                id="gateway"
                required
                className={selectClass}
                value={gateway}
                onChange={(event) => setGateway(event.target.value)}
              >
                <option value="">Selecione o gateway</option>
                {gateways.data?.map((item) => (
                  <option key={item} value={item}>
                    {item === "stripe" ? "Stripe" : "AbacatePay"}
                  </option>
                ))}
              </select>
              {gateways.isError && (
                <p role="alert" className="text-sm text-destructive">
                  Erro ao carregar gateways.
                </p>
              )}
              {gateways.data?.length === 0 && (
                <p className="text-sm text-destructive">Nenhum gateway ativo disponível.</p>
              )}
            </div>
          </fieldset>
          <p className="text-sm text-muted-foreground">
            O aluno paga no checkout do gateway. O pedido será confirmado após a aprovação do
            pagamento.
          </p>
          {create.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(create.error)}
            </p>
          )}
          <Button type="submit" disabled={!valid || create.isPending}>
            {create.isPending
              ? "Gerando link…"
              : submitted
                ? "Tentar obter o link novamente"
                : "Criar pedido e gerar link"}
          </Button>
        </form>
      )}
    </dialog>
  );
}
