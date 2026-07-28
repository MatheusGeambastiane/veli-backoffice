export type BillingSummaryPeriod = {
  overview: boolean;
  month: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type BillingSummaryTotals = {
  paid_orders_count: number;
  paid_payments_count: number;
  asaas_amount_gross: number;
  asaas_fee_amount: number;
  asaas_amount_net: number;
  total_billed_amount: number;
  bills_count: number;
  bills_amount: number;
  employee_payments_count: number;
  employee_payments_amount: number;
  total_expenses_amount: number;
  caixa?: number;
  total_available_asaas?: number;
  asaas_balance_source?: string;
  asaas_balance_cached?: boolean;
  asaas_balance_synced_at?: string | null;
};

export type BillingAmountByOffer = {
  offer_id: number;
  offer_name: string;
  campaign_id: number;
  campaign_name: string;
  paid_orders_count: number;
  paid_payments_count: number;
  asaas_amount_gross: number;
  asaas_fee_amount: number;
  asaas_amount_net: number;
  total_billed_amount: number;
};

export type AsaasStatusSummary = {
  status: string;
  count: number;
};

export type BillingSummary = {
  period: BillingSummaryPeriod;
  totals: BillingSummaryTotals;
  caixa?: number;
  total_available_asaas?: number;
  asaas_balance_source?: string;
  asaas_balance_cached?: boolean;
  asaas_balance_synced_at?: string | null;
  billed_amount_by_offer: BillingAmountByOffer[];
  asaas_status: AsaasStatusSummary[];
};

export type BillingSummaryParams = {
  overview?: boolean;
  month?: string;
  start_date?: string;
  end_date?: string;
};

export type MonthlyPlanPaymentsParams = {
  month: string;
  sync: boolean;
};

export type MonthlyPlanPaymentTotals = {
  total_count: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  expected_amount: number;
  received_amount: number;
  amount_to_receive: number;
};

export type MonthlyPlanPaymentEntry = {
  offer_id: number;
  offer_name: string;
  order_id: number;
  student_id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  billing_option_id: number;
  billing_option_code: string;
  cycle_number: number;
  cycle_total: number;
  due_date: string;
  status: "paid" | "pending" | "overdue" | string;
  amount_expected: number;
  amount_received: number;
  charge_id: number | null;
  charge_origin: string;
  paid_at: string | null;
  is_projected: boolean;
};

export type MonthlyPlanPaymentPlan = {
  offer_id: number;
  offer_name: string;
  totals: MonthlyPlanPaymentTotals;
  entries: MonthlyPlanPaymentEntry[];
};

export type MonthlyPlanPayments = {
  period: {
    month: string;
    start_date: string;
    end_date: string;
    asaas_sync: boolean | null;
  };
  totals: MonthlyPlanPaymentTotals;
  plans: MonthlyPlanPaymentPlan[];
};

export type LatestReceivedPaymentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cpf: string;
  phone: string;
};

export type LatestReceivedPaymentOffer = {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
};

export type LatestReceivedPayment = {
  id: number;
  order: number;
  user: LatestReceivedPaymentUser;
  offer: LatestReceivedPaymentOffer;
  payment_mode: "monthly" | "one_time" | string;
  cycle_number: number | null;
  cycle_numbers: number[];
  is_advance_payment: boolean;
  is_payoff: boolean;
  is_one_time: boolean;
  is_monthly: boolean;
  gateway: string;
  gateway_charge_id: string;
  billing_method: "pix" | "credit_card" | string;
  amount_gross: string;
  fee_amount: string;
  amount_net: string;
  paid_at: string;
  origin: string;
};

export type LatestReceivedPaymentsResponse = {
  count: number;
  results: LatestReceivedPayment[];
};

export type ReceivedPaymentsParams = {
  search?: string;
  month?: string;
  page: number;
  page_size: number;
};

export type ReceivedPaymentsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: LatestReceivedPayment[];
  page: number;
  page_size: number;
  total_pages: number;
  total_amount: number;
};

export type ReceivedPaymentBillingOption = {
  id: number;
  code: string;
  type: string;
  cycle: string;
  billing_method: string;
  price: string;
  allowed_installments: number[];
  is_active: boolean;
};

export type ReceivedPaymentOrder = {
  id: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_mode: string;
  payment_type: string;
  payment_installments: number | null;
  billing_day: number | null;
  next_billing_at: string | null;
  created_at: string;
};

export type ReceivedPaymentOfferDetails = LatestReceivedPaymentOffer & {
  campaign: {
    id: number;
    name: string;
    start_date: string;
    finish_date: string;
  } | null;
  plan_type: string;
  billing_interval_months: number | null;
  billing_options: ReceivedPaymentBillingOption[];
};

export type ReceivedPaymentStudentClass = {
  id: number;
  course: number;
  course_name: string;
  language_icon: string | null;
  teacher_profile: number | null;
  teacher_full_name: string;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string | null;
  is_active: boolean;
  is_generic: boolean;
};

export type ReceivedPaymentDetails = Omit<LatestReceivedPayment, "order" | "offer"> & {
  order: ReceivedPaymentOrder;
  offer: ReceivedPaymentOfferDetails;
  student_class: ReceivedPaymentStudentClass | null;
  billing_option: ReceivedPaymentBillingOption | null;
  billing_subscription: {
    id: number;
    status: string;
    gateway_subscription_id: string;
    next_due_date: string | null;
    cancel_at_period_end: boolean;
  } | null;
  gateway_invoice_number: string | null;
  gateway_status: string;
  status: string;
  installments: number | null;
  due_date: string | null;
  available_at: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeePaymentStatus = "pending" | "paid" | "canceled";

export type BillStatus = "pending" | "paid" | "canceled";

export type BillKind = "fixed" | "unexpected";

export type BillRecurrence = "none" | "monthly" | "biweekly";

export type Bill = {
  id: number;
  name: string;
  category: string;
  kind: BillKind;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: BillStatus;
  competence_month: string;
  description: string;
  is_recurring: boolean;
  recurrence: BillRecurrence;
  recurrence_end_date: string | null;
  parent_bill: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
};

export type BillsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Bill[];
};

export type CreateBillPayload = {
  name: string;
  category: string;
  kind: BillKind;
  amount: string;
  due_date: string;
  status: BillStatus;
  competence_month: string;
  description: string;
  is_recurring: boolean;
  recurrence?: Exclude<BillRecurrence, "none">;
  recurrence_end_date?: string;
  is_active: boolean;
};

export type EmployeePaymentRecurrence = "none" | "monthly";

export type EmployeePaymentRole = "teacher" | "manager" | "administrative";

export type EmployeePaymentSimpleEmployee = {
  id: number;
  full_name: string;
};

export type EmployeePaymentEmployeeDetail = {
  id: number;
  username?: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone: string | null;
  cpf: string | null;
  profile_pic?: string | null;
  cnpj?: string | null;
  role?: EmployeePaymentRole;
};

export type EmployeePayment = {
  id: number;
  employee: number;
  role?: EmployeePaymentRole;
  employee_detail: EmployeePaymentEmployeeDetail;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: EmployeePaymentStatus;
  description: string;
  competence_month: string;
  is_recurring: boolean;
  recurrence: EmployeePaymentRecurrence;
  recurrence_end_date: string | null;
  parent_payment: number | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
};

export type FinanceTransactionDirection = "expense" | "income";

export type FinanceTransactionStatus = "pending" | "paid" | "canceled";

export type FinanceTransaction = {
  id: number;
  direction: FinanceTransactionDirection;
  status: FinanceTransactionStatus;
  amount: string;
  occurred_at: string;
  available_at: string | null;
  description: string;
  payment_receipt: string | null;
  bill: number | null;
  employee_payment: number | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

export type BillDetails = Bill & {
  finance_transactions: FinanceTransaction[];
};

export type EmployeePaymentStudentClass = {
  id: number;
  course: number;
  course_name: string;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  is_active: boolean;
  total_students: number;
  schedule_slots: number;
  synchronous_classes_count: number;
  dedicated_hours: string;
};

export type EmployeePaymentDetails = EmployeePayment & {
  finance_transactions: FinanceTransaction[];
  metrics_period: {
    month: string;
  };
  student_classes: EmployeePaymentStudentClass[];
  total_schedule_slots: number;
  total_students: number;
  cost_per_student: string;
  total_synchronous_classes: number;
  total_dedicated_hours: string;
};

export type EmployeePaymentsSummary = {
  period: BillingSummaryPeriod;
  totals: {
    count: number;
    total_amount: string;
  };
  employee_payments: EmployeePayment[];
};

export type CreateEmployeePaymentPayload = {
  employee: number;
  amount: string;
  due_date: string;
  status: EmployeePaymentStatus;
  description: string;
  competence_month: string;
  is_recurring: boolean;
  recurrence: EmployeePaymentRecurrence;
  recurrence_end_date: string | null;
};
