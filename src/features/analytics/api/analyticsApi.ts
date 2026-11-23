import { httpClient } from "@/shared/lib/http/http";
import type { AnalyticsError, AnalyticsPeriod, AnalyticsResponse, AnalyticsSource } from "@/features/analytics/types/analytics";
import type {
  DashboardLanguage,
  LeadStage,
  PlacementLeadFilters,
  LeadSummary,
  Paginated,
  PlacementLeadDetail,
  PlacementLeadCommunication,
  PlacementLeadCommunicationPayload,
  PlacementLeadBulkCampaign,
  PlacementLeadBulkCampaignPayload,
  PlacementLeadSummary,
  PlacementLeadWhatsappTemplate,
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

function leadParams(search: string, filters: PlacementLeadFilters) {
  const params = new URLSearchParams({ search });
  if (filters.language) params.set("language", filters.language);
  if (filters.estimated_level) params.set("estimated_level", filters.estimated_level);
  if (filters.has_purchased) params.set("has_purchased", filters.has_purchased);
  if (filters.status) params.set("status", filters.status);
  return params;
}

export const analyticsApi = {
  reviewError: (eventId: string, isSeen: boolean) =>
    httpClient.patch<AnalyticsError>(`/dashboard/analytics/errors/${encodeURIComponent(eventId)}/`, { is_seen: isSeen }),
  summary: (source: AnalyticsSource, period: AnalyticsPeriod) =>
    httpClient.get<AnalyticsResponse>(`/dashboard/analytics/?source=${source}&period=${period}`),
  placementLeads: (page: number, search: string, stage?: LeadStage, filters: PlacementLeadFilters = {}) =>
    httpClient.get<Paginated<PlacementLeadSummary>>(
      `/dashboard/placement-leads/?page=${page}&${leadParams(search, filters)}${stage ? `&stage=${stage}` : ""}`,
    ),
  leadSummary: (search: string, filters: PlacementLeadFilters = {}) => httpClient.get<LeadSummary>(`/dashboard/placement-leads/summary/?${leadParams(search, filters)}`),
  placementLead: (id: number) =>
    httpClient.get<PlacementLeadDetail>(`/dashboard/placement-leads/${id}/`),
  updatePlacementLead: (id: number, payload: { is_contacted?: boolean; observation?: string; stage?: LeadStage }) =>
    httpClient.patch<PlacementLeadDetail>(`/dashboard/placement-leads/${id}/`, payload),
  placementLeadCommunications: (id: number) =>
    httpClient.get<PlacementLeadCommunication[]>(`/dashboard/placement-leads/${id}/communications/`),
  placementLeadWhatsappTemplates: (id: number) =>
    httpClient.get<PlacementLeadWhatsappTemplate[]>(`/dashboard/placement-leads/${id}/whatsapp-templates/`),
  sendPlacementLeadCommunication: (id: number, payload: PlacementLeadCommunicationPayload) =>
    httpClient.post<PlacementLeadCommunication>(`/dashboard/placement-leads/${id}/communications/`, payload),
  createPlacementLeadBulkCampaign: (payload: PlacementLeadBulkCampaignPayload) =>
    httpClient.post<PlacementLeadBulkCampaign>("/dashboard/placement-leads/bulk-communications/", payload),
  placementLeadBulkCampaign: (id: number) =>
    httpClient.get<PlacementLeadBulkCampaign>(`/dashboard/placement-leads/bulk-communications/${id}/`),
  cancelPlacementLeadBulkCampaign: (id: number) =>
    httpClient.post<PlacementLeadBulkCampaign>(`/dashboard/placement-leads/bulk-communications/${id}/cancel/`),
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
