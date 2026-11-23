import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { couponsApi } from "@/features/coupons/api/couponsApi";
import { offersApi } from "@/features/offers/api/offersApi";
import type { CouponPayload } from "@/features/coupons/types/coupon";

const couponsKey = ["coupons"] as const;

export function useCoupons(search: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: [...couponsKey, search],
    queryFn: () => couponsApi.list(search),
    enabled: status === "authenticated",
    placeholderData: (previous) => previous,
  });
}

export function useCouponOffers() {
  const { status } = useSession();
  return useQuery({
    queryKey: [...couponsKey, "offers"],
    queryFn: async () => {
      const first = await offersApi.list({ pageSize: 100 });
      const results = [...first.results];
      let next = first.next;
      let page = 2;
      while (next) {
        const response = await offersApi.list({ pageSize: 100, page });
        results.push(...response.results);
        next = response.next;
        page += 1;
      }
      return { ...first, results, next: null };
    },
    enabled: status === "authenticated",
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CouponPayload) => couponsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponsKey }),
  });
}

export function useToggleCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      couponsApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponsKey }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CouponPayload> }) =>
      couponsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponsKey }),
  });
}
