export type OfferCourse = {
  id: number;
  name: string;
  language?: number;
  language_name?: string;
  language_icon?: string | null;
  level?: number;
  level_name?: string;
  description?: string | null;
  is_active?: boolean;
};

export type OfferCampaignRef =
  | {
      id: number;
      name: string;
    }
  | null;

export type OfferListItem = {
  id: number;
  name: string;
  campaign: OfferCampaignRef;
  course: OfferCourse[];
  price: string;
};

export type OfferListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OfferListItem[];
};

export type OfferListParams = {
  name?: string;
  page?: number;
  pageSize?: number;
};

export type SimpleOfferCourse = {
  id: number;
  name: string;
};

export type SimpleOfferClass = {
  id: number;
  name: string;
};

export type PaymentMode = "one_time" | "monthly";

export type BillingOptionCode =
  | "UPFRONT_PIX"
  | "UPFRONT_CREDIT_CARD"
  | "MONTHLY_PIX"
  | "MONTHLY_CREDIT_CARD";

export type BillingOptionPayload = {
  code: BillingOptionCode;
  type: "one_time" | "recurring";
  cycle: "none" | "monthly";
  billing_method: "pix" | "credit_card";
  price: string;
  allowed_installments: number[];
  is_active: boolean;
};

export type CreateOfferPayload = {
  name: string;
  student_classes: number[];
  courses: number[];
  access_duration_days: number;
  grace_period_days: number;
  price: string;
  is_active: boolean;
  payment_mode: PaymentMode[];
  allow_cash_discount: boolean;
  plan_type: "one_time" | "monthly";
  billing_options: BillingOptionPayload[];
};
