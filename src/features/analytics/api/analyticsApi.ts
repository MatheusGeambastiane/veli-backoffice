import { httpClient } from "@/shared/lib/http/http";
import type { AnalyticsPeriod, AnalyticsResponse, AnalyticsSource } from "@/features/analytics/types/analytics";
import type {
  DashboardLanguage,
  Paginated,
  PlacementLeadDetail,
  PlacementLeadSummary,
  PlacementQuestion,
} from "@/features/analytics/types/placementLeads";

export const analyticsApi = {
  summary: (source: AnalyticsSource, period: AnalyticsPeriod) =>
    httpClient.get<AnalyticsResponse>(`/dashboard/analytics/?source=${source}&period=${period}`),
  placementLeads: (page: number, search: string) =>
    httpClient.get<Paginated<PlacementLeadSummary>>(
      `/dashboard/placement-leads/?page=${page}&search=${encodeURIComponent(search)}`,
    ),
  placementLead: (id: number) =>
    httpClient.get<PlacementLeadDetail>(`/dashboard/placement-leads/${id}/`),
  updatePlacementLead: (id: number, payload: { is_contacted: boolean; observation: string }) =>
    httpClient.patch<PlacementLeadDetail>(`/dashboard/placement-leads/${id}/`, payload),
  placementQuestions: () =>
    httpClient.get<Paginated<PlacementQuestion>>("/dashboard/placement-questions/?page_size=100"),
  createPlacementQuestion: (payload: Omit<PlacementQuestion, "id" | "language_name">) =>
    httpClient.post<PlacementQuestion>("/dashboard/placement-questions/", payload),
  updatePlacementQuestion: (id: number, payload: Omit<PlacementQuestion, "id" | "language_name">) =>
    httpClient.patch<PlacementQuestion>(`/dashboard/placement-questions/${id}/`, payload),
  dashboardLanguages: () =>
    httpClient.get<Paginated<DashboardLanguage>>("/dashboard/languages/?page_size=100"),
};
