import { httpClient } from "@/shared/lib/http/http";
import type {
  BillingSummary,
  BillingGateway,
  GatewayMetrics,
  BillingSummaryParams,
  BillDetails,
  BillsResponse,
  CreateBillPayload,
  CreateEmployeePaymentPayload,
  EmployeePayment,
  EmployeePaymentDetails,
  EmployeePaymentsSummary,
  EmployeePaymentSimpleEmployee,
  GatewayFinancialStatement,
  LatestReceivedPaymentsResponse,
  MonthlyPlanPayments,
  MonthlyPlanPaymentsParams,
  ReceivedPaymentDetails,
  ReceivedPaymentsParams,
  ReceivedPaymentsResponse,
} from "@/features/billing/types/billingDashboard";

export const billingApi = {
  gatewayMetrics: (gateway: BillingGateway, params: BillingSummaryParams, sync = false) => {
    const searchParams = new URLSearchParams({ gateway, sync: String(sync) });
    if (!params.overview && params.month) {
      const [year, month] = params.month.split("-").map(Number);
      searchParams.set("start_date", `${params.month}-01`);
      searchParams.set(
        "end_date",
        `${params.month}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`,
      );
    } else if (!params.overview) {
      if (params.start_date) searchParams.set("start_date", params.start_date);
      if (params.end_date) searchParams.set("end_date", params.end_date);
    }
    return httpClient.get<GatewayMetrics>(`/dashboard/billing/gateway-metrics/?${searchParams}`);
  },
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
    const path = query ? `/dashboard/billing/summary/?${query}` : "/dashboard/billing/summary/";

    return httpClient.get<BillingSummary>(path);
  },
  gatewayFinancialStatement: (params: BillingSummaryParams) => {
    const searchParams = new URLSearchParams();

    if (!params.overview && params.month) {
      const [year, month] = params.month.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      searchParams.set("startDate", `${params.month}-01`);
      searchParams.set("endDate", `${params.month}-${String(lastDay).padStart(2, "0")}`);
    } else if (!params.overview) {
      if (params.start_date) searchParams.set("startDate", params.start_date);
      if (params.end_date) searchParams.set("endDate", params.end_date);
    }

    const query = searchParams.toString();
    const path = query
      ? `/dashboard/billing/gateway-financial-statement/?${query}`
      : "/dashboard/billing/gateway-financial-statement/";
    return httpClient.get<GatewayFinancialStatement>(path);
  },
  monthlyPlanPayments: ({ month, sync, gateways }: MonthlyPlanPaymentsParams) => {
    const searchParams = new URLSearchParams({
      month,
      sync: String(sync),
    });

    if (sync && gateways?.length) {
      searchParams.set("gateway", gateways.join(","));
    }

    return httpClient.get<MonthlyPlanPayments>(
      `/dashboard/billing/monthly-plan-payments/?${searchParams.toString()}`,
    );
  },
  latestReceivedPayments: () =>
    httpClient.get<LatestReceivedPaymentsResponse>("/dashboard/billing/latest-received-payments/"),
  receivedPayments: (params: ReceivedPaymentsParams) => {
    const searchParams = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.page_size),
    });

    if (params.search) {
      searchParams.set("search", params.search);
    }

    if (params.month) {
      searchParams.set("month", params.month);
    }

    return httpClient.get<ReceivedPaymentsResponse>(
      `/dashboard/billing/received-payments/?${searchParams.toString()}`,
    );
  },
  receivedPaymentDetails: (id: string) =>
    httpClient.get<ReceivedPaymentDetails>(`/dashboard/billing/received-payments/${id}/`),
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
      "/dashboard/employee-payments/employees/simple/",
    ),
  createEmployeePayment: (payload: CreateEmployeePaymentPayload) =>
    httpClient.post<EmployeePayment>("/dashboard/employee-payments/", payload),
  createBill: (payload: CreateBillPayload) => httpClient.post("/dashboard/bills/", payload),
  billDetails: (id: string) => httpClient.get<BillDetails>(`/dashboard/bills/${id}/`),
  createFinanceTransaction: (payload: FormData) =>
    httpClient.post("/dashboard/finance-transactions/", payload),
  employeePaymentDetails: (id: string) =>
    httpClient.get<EmployeePaymentDetails>(`/dashboard/employee-payments/${id}/`),
};
