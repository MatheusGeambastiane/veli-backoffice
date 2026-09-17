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
    queryFn: () => offersApi.list({ pageSize: 100 }),
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
