import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { billingApi } from "@/features/billing/api/billingApi";
import type {
  BillingSummaryParams,
  CreateBillPayload,
  CreateEmployeePaymentPayload,
  MonthlyPlanPaymentsParams,
} from "@/features/billing/types/billingDashboard";

export const billingKeys = {
  all: ["billing"] as const,
  summary: (params: BillingSummaryParams) => [...billingKeys.all, "summary", params] as const,
  monthlyPlanPayments: (params: MonthlyPlanPaymentsParams) =>
    [...billingKeys.all, "monthly-plan-payments", params] as const,
  employeePayments: () => [...billingKeys.all, "employee-payments"] as const,
  employeePaymentsSummary: (params: BillingSummaryParams) =>
    [...billingKeys.employeePayments(), "summary", params] as const,
  bills: (params: BillingSummaryParams) => [...billingKeys.all, "bills", params] as const,
  billDetails: (id: string) => [...billingKeys.all, "bills", "detail", id] as const,
  employeePaymentDetails: (id: string) =>
    [...billingKeys.employeePayments(), "detail", id] as const,
  employeesSimple: () => [...billingKeys.employeePayments(), "employees-simple"] as const,
};

export function useBillingSummary(params: BillingSummaryParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.summary(params),
    queryFn: () => billingApi.summary(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useMonthlyPlanPayments(params: MonthlyPlanPaymentsParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.monthlyPlanPayments(params),
    queryFn: () => billingApi.monthlyPlanPayments(params),
    enabled: status === "authenticated" && Boolean(params.month),
    refetchOnWindowFocus: false,
  });
}

export function useEmployeePaymentsSummary(params: BillingSummaryParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.employeePaymentsSummary(params),
    queryFn: () => billingApi.employeePaymentsSummary(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useBills(params: BillingSummaryParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.bills(params),
    queryFn: () => billingApi.bills(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useBillDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.billDetails(id),
    queryFn: () => billingApi.billDetails(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useEmployeePaymentsEmployees() {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.employeesSimple(),
    queryFn: billingApi.employeesSimple,
    enabled: status === "authenticated",
  });
}

export function useEmployeePaymentDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: billingKeys.employeePaymentDetails(id),
    queryFn: () => billingApi.employeePaymentDetails(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useCreateEmployeePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePaymentPayload) =>
      billingApi.createEmployeePayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBillPayload) => billingApi.createBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCreateFinanceTransaction(
  options: {
    employeePaymentId?: string;
    billId?: string;
  } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => billingApi.createFinanceTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      if (options.employeePaymentId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.employeePaymentDetails(options.employeePaymentId),
        });
      }
      if (options.billId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.billDetails(options.billId),
        });
      }
    },
  });
}
