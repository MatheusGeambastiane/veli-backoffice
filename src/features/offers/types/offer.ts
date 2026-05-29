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

export type OfferCampaignDetail = {
  id: number;
  name: string;
  start_date: string;
  finish_date: string;
  salles_target: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
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

export type OfferStudentClass = {
  id: number;
  course: number;
  course_name: string;
  language_icon: string | null;
  teacher_profile: number | null;
  teacher_full_name: string | null;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string | null;
  is_active: boolean;
  is_generic: boolean;
};

export type OfferBillingOption = {
  id: number;
  code: string;
  type: "one_time" | "recurring" | string;
  cycle: "none" | "monthly" | string;
  billing_method: "pix" | "credit_card" | string;
  price: string;
  allowed_installments: number[];
  is_active?: boolean;
};

export type OfferOrdersByBillingOption = {
  billing_option: Omit<OfferBillingOption, "allowed_installments" | "is_active">;
  total_orders: number;
};

export type OfferDetail = {
  id: number;
  name: string;
  campaign: OfferCampaignDetail | null;
  student_classes: OfferStudentClass[];
  courses: OfferCourse[];
  access_days: number | null;
  access_duration_days: number | null;
  grace_period_days: number | null;
  price: string;
  is_active: boolean;
  plan_type: "one_time" | "monthly" | string;
  billing_interval_months: number | null;
  allow_cash_discount: boolean;
  cash_discount_type: string | null;
  cash_discount_value: string | null;
  billing_options: OfferBillingOption[];
  total_billed_amount: string;
  total_orders_count: number;
  orders_by_billing_option: OfferOrdersByBillingOption[];
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
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
