import { httpClient } from "@/shared/lib/http/http";
import type { OrderListParams, OrderListResponse } from "@/features/orders/types/order";

export const ordersApi = {
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
};
