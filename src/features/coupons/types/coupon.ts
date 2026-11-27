export type Coupon = {
  id: number;
  code: string;
  offers: number[];
  offer_names: string[];
  offer?: number | null;
  offer_name?: string | null;
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
  offers: number[];
  max_usage: number;
  discount_type: "fixed" | "percent";
  discount_value: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type CouponDetail = Coupon & {
  usage_by_offer: { id: number; name: string; uses: number }[];
};

export type CouponUsagePage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    id: number;
    invoice_id: number | null;
    order_number: number | null;
    offer_name: string;
    used_at: string;
  }[];
};
