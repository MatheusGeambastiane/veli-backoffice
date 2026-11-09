import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ordersApi } from "@/features/orders/api/ordersApi";
import type { OrderListParams } from "@/features/orders/types/order";

export const ordersKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => [...ordersKeys.all, "list", params] as const,
  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
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

export function useOrderDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => ordersApi.details(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
