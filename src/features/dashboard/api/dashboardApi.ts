import { httpClient } from "@/shared/lib/http/http";
import type { DashboardSummary } from "@/features/dashboard/types/dashboardTypes";

export const dashboardApi = {
  summary: () => httpClient.get<DashboardSummary>("/dashboard/student-classes/summary/"),
};
