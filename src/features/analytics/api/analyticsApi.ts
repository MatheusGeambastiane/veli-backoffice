import { httpClient } from "@/shared/lib/http/http";
import type { AnalyticsPeriod, AnalyticsResponse, AnalyticsSource } from "@/features/analytics/types/analytics";
import type {
  DashboardLanguage,
  Paginated,
  PlacementLeadDetail,
  PlacementLeadSummary,
  PlacementQuestion,
} from "@/features/analytics/types/placementLeads";

export type PlacementQuestionPayload = Omit<PlacementQuestion, "id" | "language_name" | "audio_url"> & { audio?: File | null };

function questionBody(payload: PlacementQuestionPayload) {
  if (!(payload.audio instanceof File)) return payload;
  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (value instanceof File) body.append(key, value);
    else body.append(key, key === "options" ? JSON.stringify(value) : String(value));
  }
  return body;
}

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
  placementQuestions: (filters: { language?: string; level?: string; skill?: string; page?: number } = {}) => {
    const params = new URLSearchParams({ page_size: "20", page: String(filters.page ?? 1) });
    for (const key of ["language", "level", "skill"] as const) {
      if (filters[key]) params.set(key, filters[key]);
    }
    return httpClient.get<Paginated<PlacementQuestion>>(`/dashboard/placement-questions/?${params}`);
  },
  createPlacementQuestion: (payload: PlacementQuestionPayload) =>
    httpClient.post<PlacementQuestion>("/dashboard/placement-questions/", questionBody(payload)),
  updatePlacementQuestion: (id: number, payload: PlacementQuestionPayload) =>
    httpClient.patch<PlacementQuestion>(`/dashboard/placement-questions/${id}/`, questionBody(payload)),
  dashboardLanguages: () =>
    httpClient.get<Paginated<DashboardLanguage>>("/dashboard/languages/?page_size=100"),
};
