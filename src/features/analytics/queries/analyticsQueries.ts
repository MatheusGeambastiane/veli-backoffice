import type { LeadStage, PlacementLeadBulkCampaignPayload, PlacementLeadCommunicationPayload, PlacementLeadFilters } from "@/features/analytics/types/placementLeads";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { analyticsApi } from "@/features/analytics/api/analyticsApi";
import type { AnalyticsPeriod, AnalyticsResponse, AnalyticsSource } from "@/features/analytics/types/analytics";

export function useReviewAnalyticsError() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["review-analytics-error"],
    mutationFn: ({ eventId, isSeen }: { eventId: string; isSeen: boolean }) =>
      analyticsApi.reviewError(eventId, isSeen),
    onSuccess: (updated) => {
      queryClient.setQueriesData<AnalyticsResponse>({ queryKey: ["analytics"] }, (previous) => previous ? {
        ...previous,
        errors: previous.errors.map((error) => error.event_id === updated.event_id ? updated : error),
      } : previous);
      return queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useReviewAllAnalyticsErrors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["review-analytics-error"],
    mutationFn: async (eventIds: string[]) => {
      for (const eventId of eventIds) {
        const updated = await analyticsApi.reviewError(eventId, true);
        queryClient.setQueriesData<AnalyticsResponse>({ queryKey: ["analytics"] }, (previous) => previous ? {
          ...previous,
          errors: previous.errors.map((error) => error.event_id === updated.event_id ? updated : error),
        } : previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["analytics"] }),
  });
}

export function useAnalytics(source: AnalyticsSource, period: AnalyticsPeriod) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["analytics", source, period],
    queryFn: () => analyticsApi.summary(source, period),
    enabled: status === "authenticated",
    placeholderData: (previous) => previous,
  });
}

export function usePlacementLeads(page: number, search: string, filters: PlacementLeadFilters = {}) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-leads", page, search, filters],
    queryFn: () => analyticsApi.placementLeads(page, search, undefined, filters),
    enabled: status === "authenticated",
  });
}

export function usePlacementLead(id: number | null) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-lead", id],
    queryFn: () => analyticsApi.placementLead(id as number),
    enabled: status === "authenticated" && id !== null,
  });
}

export function useUpdatePlacementLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Parameters<typeof analyticsApi.updatePlacementLead>[1]) =>
      analyticsApi.updatePlacementLead(id, payload),
    onSuccess: (lead) => {
      queryClient.setQueryData(["placement-lead", lead.id], lead);
      return Promise.all([queryClient.invalidateQueries({ queryKey: ["placement-leads"] }), queryClient.invalidateQueries({ queryKey: ["lead-summary"] })]);
    },
  });
}

export function usePlacementLeadCommunications(id: number) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-lead", id, "communications"],
    queryFn: () => analyticsApi.placementLeadCommunications(id),
    enabled: status === "authenticated",
    refetchInterval: 5000,
  });
}

export function usePlacementLeadWhatsappTemplates(id: number) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-lead", id, "whatsapp-templates"],
    queryFn: () => analyticsApi.placementLeadWhatsappTemplates(id),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useSendPlacementLeadCommunication(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlacementLeadCommunicationPayload) =>
      analyticsApi.sendPlacementLeadCommunication(id, payload),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["placement-lead", id] }),
      queryClient.invalidateQueries({ queryKey: ["placement-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["lead-summary"] }),
    ]),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["placement-lead", id, "communications"] }),
  });
}

export function useCreatePlacementLeadBulkCampaign() {
  return useMutation({
    mutationFn: (payload: PlacementLeadBulkCampaignPayload) =>
      analyticsApi.createPlacementLeadBulkCampaign(payload),
  });
}

export function usePlacementLeadBulkCampaign(id: number | null) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-lead-bulk-campaign", id],
    queryFn: () => analyticsApi.placementLeadBulkCampaign(id as number),
    enabled: status === "authenticated" && id !== null,
    refetchInterval: (query) => {
      const campaignStatus = query.state.data?.status;
      return campaignStatus === "completed" || campaignStatus === "canceled" ? false : 2000;
    },
  });
}

export function useCancelPlacementLeadBulkCampaign(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyticsApi.cancelPlacementLeadBulkCampaign(id),
    onSuccess: (campaign) => queryClient.setQueryData(["placement-lead-bulk-campaign", id], campaign),
  });
}

export function usePlacementQuestions(filters: Parameters<typeof analyticsApi.placementQuestions>[0] = {}) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-questions", filters],
    queryFn: () => analyticsApi.placementQuestions(filters),
    enabled: status === "authenticated",
  });
}

export function useDashboardLanguages() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["dashboard-languages", "placement"],
    queryFn: analyticsApi.dashboardLanguages,
    enabled: status === "authenticated",
  });
}

export function useSavePlacementQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: {
      id?: number;
      payload: Parameters<typeof analyticsApi.createPlacementQuestion>[0];
    }) => id
      ? analyticsApi.updatePlacementQuestion(id, payload)
      : analyticsApi.createPlacementQuestion(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["placement-questions"] }),
  });
}

export function useLeadSummary(search: string, filters: PlacementLeadFilters = {}) {
  const { status } = useSession();
  return useQuery({ queryKey: ["lead-summary", search, filters], queryFn: () => analyticsApi.leadSummary(search, filters), enabled: status === "authenticated" });
}

export function useLeadColumn(search: string, stage: LeadStage, filters: PlacementLeadFilters = {}) {
  const { status } = useSession();
  return useInfiniteQuery({
    queryKey: ["placement-leads", "kanban", search, stage, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => analyticsApi.placementLeads(pageParam, search, stage, filters),
    getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
    enabled: status === "authenticated",
  });
}
