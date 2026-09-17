export type Coupon = {
  id: number;
  code: string;
  offer: number;
  offer_name: string;
  max_usage: number;
  used_count: number;
  discount_type: "fixed" | "percent";
  discount_value: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CouponListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Coupon[];
};

export type CouponPayload = {
  code: string;
  offer: number;
  max_usage: number;
  discount_type: "fixed" | "percent";
  discount_value: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};
