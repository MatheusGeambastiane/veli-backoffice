import { httpClient } from "@/shared/lib/http/http";
import type { Coupon, CouponListResponse, CouponPayload } from "@/features/coupons/types/coupon";

export const couponsApi = {
  list: (search = "") => {
    const query = new URLSearchParams({ page_size: "100" });
    if (search) query.set("search", search);
    return httpClient.get<CouponListResponse>(`/dashboard/coupons/?${query}`);
  },
  create: (payload: CouponPayload) => httpClient.post<Coupon>("/dashboard/coupons/", payload),
  update: (id: number, payload: Partial<CouponPayload>) =>
    httpClient.patch<Coupon>(`/dashboard/coupons/${id}/`, payload),
};
