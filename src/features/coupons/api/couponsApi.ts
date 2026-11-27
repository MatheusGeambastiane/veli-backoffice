import { httpClient } from "@/shared/lib/http/http";
import type { Coupon, CouponDetail, CouponUsagePage, CouponListResponse, CouponPayload } from "@/features/coupons/types/coupon";

export const couponsApi = {
  list: (search = "") => {
    const query = new URLSearchParams({ page_size: "100" });
    if (search) query.set("search", search);
    return httpClient.get<CouponListResponse>(`/dashboard/coupons/?${query}`);
  },
  detail: (id: number) => httpClient.get<CouponDetail>(`/dashboard/coupons/${id}/`),
  uses: (id: number, page: number) =>
    httpClient.get<CouponUsagePage>(`/dashboard/coupons/${id}/uses/?page=${page}`),
  create: (payload: CouponPayload) => httpClient.post<Coupon>("/dashboard/coupons/", payload),
  update: (id: number, payload: Partial<CouponPayload>) =>
    httpClient.patch<Coupon>(`/dashboard/coupons/${id}/`, payload),
};
