export type OrderPreferencePeriod = "morning" | "afternoon" | "night" | "no_preference";

export type OrderListParams = {
  search?: string;
  status?: string;
  isGeneric?: boolean;
  preferencePeriod?: OrderPreferencePeriod[];
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  pageSize?: number;
};

export type OrderUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
};

export type OrderClassPreference = {
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

export type OrderBillingOption = {
  id: number;
  name: string;
};

export type OrderOfferBillingOption = {
  id: number;
  code: string;
  type: string;
  cycle: string;
  billing_method: string;
  price: string;
  allowed_installments: number[];
  is_active: boolean;
};

export type OrderOffer = {
  id: number;
  name: string;
  campaign: {
    id: number;
    name: string;
    start_date: string;
    finish_date: string;
  } | null;
  price: string;
  is_active: boolean;
  plan_type: string | null;
  billing_interval_months: number | null;
  allow_cash_discount: boolean;
  cash_discount_type: string | null;
  cash_discount_value: string | null;
  billing_options: OrderOfferBillingOption[];
  created_at: string;
  updated_at: string;
};

export type OrderPayment = {
  id: number;
  invoice: number;
  amount: string;
  payment_method: string;
  gateway: string;
  status: string;
  paid_at: string | null;
  gateway_payment_id: string | null;
  processor_reference: string | null;
  installment_number: number | null;
  installment_total: number | null;
  card_last4: string | null;
  card_brand: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderGatewayPayment = {
  id: number;
  gateway: string;
  gateway_charge_id: string | null;
  gateway_invoice_number: string | null;
  gateway_status: string;
  status: string;
  billing_method: string;
  amount_gross: string;
  fee_amount: string;
  amount_net: string;
  installments: number | null;
  due_date: string | null;
  paid_at: string | null;
  available_at: string | null;
  origin: string;
  created_at: string;
  updated_at: string;
};

export type OrderInvoice = {
  id: number;
  status: string;
  payment_method: string | null;
  amount_original: string;
  discount_amount: string;
  amount_due: string;
  amount_paid: string;
  paid_at: string | null;
  due_date: string | null;
  billing_cycle_number: number;
  installments_total: number;
  installments_paid_count: number;
  created_at: string;
};

export type OrderBillingSubscription = {
  id: number;
  gateway: string;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  status: string;
  billing_method: string;
  next_due_date: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
} | null;

export type OrderDetail = {
  id: number;
  user: OrderUser;
  offer: OrderOffer;
  billing_option: OrderBillingOption | null;
  coupon: number | null;
  amount_original: string;
  discount_amount: string;
  amount_due: string;
  status: string;
  checkout_status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  class_preference: OrderClassPreference | null;
  preference_period: OrderPreferencePeriod[];
  payment_mode: string;
  payment_type: string;
  payment_installments: number | null;
  billing_day: number | null;
  next_billing_at: string | null;
  contract_acceptance_status: string;
  contract_accepted_at: string | null;
  total_paid: string;
  payments_count: number;
  asaas_payments_count: number;
  gateways: string[];
  invoices: OrderInvoice[];
  payments: OrderPayment[];
  gateway_payments: OrderGatewayPayment[];
  asaas_payments: OrderGatewayPayment[];
  billing_subscription: OrderBillingSubscription;
  created_at: string;
  updated_at: string;
};

export type OrderListItem = {
  id: number;
  user: OrderUser;
  class_preference: OrderClassPreference | null;
  status: string;
  offer_price: string;
  created_at: string;
  billing_option: OrderBillingOption | null;
};

export type OrderListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderListItem[];
};
