import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ordersApi } from "@/features/orders/api/ordersApi";
import type { OrderListParams } from "@/features/orders/types/order";

export const ordersKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => [...ordersKeys.all, "list", params] as const,
};

export function useOrdersList(params: OrderListParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => ordersApi.list(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}
