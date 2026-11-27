import { httpClient } from "@/shared/lib/http/http";
import type {
  OrderDetail,
  OrderGatewayPayment,
  OrderListParams,
  OrderListResponse,
} from "@/features/orders/types/order";

export const ordersApi = {
  checkoutGateways: () => httpClient.get<string[]>("/dashboard/orders/checkout-gateways/"),
  createCheckout: (payload: {
    request_id: string;
    user: number;
    offer: number;
    billing_option: number;
    amount_due: string;
    gateway_choice: string;
    enrollment_recurring_option?: number;
    external_checkout_id?: string;
  }) =>
    httpClient.post<{ order_id: number; checkout_url: string; gateway: string }>(
      "/dashboard/orders/create-checkout/",
      payload,
    ),
  list: (params: OrderListParams) => {
    const searchParams = new URLSearchParams();

    if (params.search) {
      searchParams.set("search", params.search);
    }

    if (params.status) {
      searchParams.set("status", params.status);
    }

    if (typeof params.isGeneric === "boolean") {
      searchParams.set("is_generic", String(params.isGeneric));
    }

    params.preferencePeriod?.forEach((period) => {
      searchParams.append("preference_period", period);
    });

    if (params.createdAtFrom) {
      searchParams.set("created_at_from", params.createdAtFrom);
    }

    if (params.createdAtTo) {
      searchParams.set("created_at_to", params.createdAtTo);
    }

    if (params.page && params.page > 1) {
      searchParams.set("page", String(params.page));
    }

    if (params.pageSize) {
      searchParams.set("page_size", String(params.pageSize));
    }

    const query = searchParams.toString();
    const path = query ? `/dashboard/orders/?${query}` : "/dashboard/orders/";
    return httpClient.get<OrderListResponse>(path);
  },
  details: (id: string) => httpClient.get<OrderDetail>(`/dashboard/orders/${id}/`),
  verifyGatewayPayment: (orderId: string, paymentId: number) =>
    httpClient.post<OrderGatewayPayment>(
      `/dashboard/orders/${orderId}/gateway-payments/${paymentId}/verify/`,
      {},
    ),
  linkGatewayPayment: (id: string, payload: {
    gateway_choice: "abacatepay" | "stripe";
    external_checkout_id: string;
    allocation: "part" | "monthly";
    confirmation?: { amount: string; excess: string };
  }) => httpClient.post<OrderGatewayPayment>(`/dashboard/orders/${id}/link-gateway-payment/`, payload),
  startEnrollmentSubscription: (id: string) =>
    httpClient.post<{ checkout_url?: string; schedule_id?: string; first_due_date: string }>(
      `/dashboard/orders/${id}/start-enrollment-subscription/`, {},
    ),
  delete: (id: string) => httpClient.delete<void>(`/dashboard/orders/${id}/`),
};
