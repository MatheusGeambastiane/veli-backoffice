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
  billed_amount_by_offer: BillingAmountByOffer[];
  asaas_status: AsaasStatusSummary[];
};

export type BillingSummaryParams = {
  overview?: boolean;
  month?: string;
  start_date?: string;
  end_date?: string;
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
