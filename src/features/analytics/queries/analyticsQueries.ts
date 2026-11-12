import type { LeadStage } from "@/features/analytics/types/placementLeads";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { analyticsApi } from "@/features/analytics/api/analyticsApi";
import type { AnalyticsPeriod, AnalyticsSource } from "@/features/analytics/types/analytics";

export function useAnalytics(source: AnalyticsSource, period: AnalyticsPeriod) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["analytics", source, period],
    queryFn: () => analyticsApi.summary(source, period),
    enabled: status === "authenticated",
    placeholderData: (previous) => previous,
  });
}

export function usePlacementLeads(page: number, search: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["placement-leads", page, search],
    queryFn: () => analyticsApi.placementLeads(page, search),
    enabled: status === "authenticated",
    placeholderData: (previous) => previous,
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

export function useLeadSummary(search: string) {
  const { status } = useSession();
  return useQuery({ queryKey: ["lead-summary", search], queryFn: () => analyticsApi.leadSummary(search), enabled: status === "authenticated" });
}

export function useLeadColumn(search: string, stage: LeadStage) {
  const { status } = useSession();
  return useInfiniteQuery({
    queryKey: ["placement-leads", "kanban", search, stage],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => analyticsApi.placementLeads(pageParam, search, stage),
    getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
    enabled: status === "authenticated",
  });
}
