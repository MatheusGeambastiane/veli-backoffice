import { httpClient } from "@/shared/lib/http/http";
import type {
  BillingSummary,
  BillingSummaryParams,
  BillDetails,
  BillsResponse,
  CreateBillPayload,
  CreateEmployeePaymentPayload,
  EmployeePayment,
  EmployeePaymentDetails,
  EmployeePaymentsSummary,
  EmployeePaymentSimpleEmployee,
} from "@/features/billing/types/billingDashboard";

export const billingApi = {
  summary: (params: BillingSummaryParams) => {
    const searchParams = new URLSearchParams();

    if (params.overview) {
      searchParams.set("overview", "true");
    } else {
      if (params.month) {
        searchParams.set("month", params.month);
      }

      if (params.start_date) {
        searchParams.set("start_date", params.start_date);
      }

      if (params.end_date) {
        searchParams.set("end_date", params.end_date);
      }
    }

    const query = searchParams.toString();
    const path = query
      ? `/dashboard/billing/summary/?${query}`
      : "/dashboard/billing/summary/";

    return httpClient.get<BillingSummary>(path);
  },
  bills: (params: BillingSummaryParams) => {
    const searchParams = new URLSearchParams();

    if (params.month) {
      searchParams.set("month", params.month);
    }

    const query = searchParams.toString();
    const path = query ? `/dashboard/bills/?${query}` : "/dashboard/bills/";

    return httpClient.get<BillsResponse>(path);
  },
  employeePaymentsSummary: (params: BillingSummaryParams) => {
    const searchParams = new URLSearchParams();

    if (params.month) {
      searchParams.set("month", params.month);
    }

    if (params.start_date) {
      searchParams.set("start_date", params.start_date);
    }

    if (params.end_date) {
      searchParams.set("end_date", params.end_date);
    }

    const query = searchParams.toString();
    const path = query
      ? `/dashboard/employee-payments/summary/?${query}`
      : "/dashboard/employee-payments/summary/";

    return httpClient.get<EmployeePaymentsSummary>(path);
  },
  employeesSimple: () =>
    httpClient.get<EmployeePaymentSimpleEmployee[]>(
      "/dashboard/employee-payments/employees/simple/"
    ),
  createEmployeePayment: (payload: CreateEmployeePaymentPayload) =>
    httpClient.post<EmployeePayment>("/dashboard/employee-payments/", payload),
  createBill: (payload: CreateBillPayload) =>
    httpClient.post("/dashboard/bills/", payload),
  billDetails: (id: string) => httpClient.get<BillDetails>(`/dashboard/bills/${id}/`),
  createFinanceTransaction: (payload: FormData) =>
    httpClient.post("/dashboard/finance-transactions/", payload),
  employeePaymentDetails: (id: string) =>
    httpClient.get<EmployeePaymentDetails>(`/dashboard/employee-payments/${id}/`),
};
