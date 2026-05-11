import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { campaignsApi } from "@/features/campaigns/api/campaignsApi";
import type { CampaignListParams, CreateCampaignPayload } from "@/features/campaigns/types/campaign";

export const campaignsKeys = {
  all: ["campaigns"] as const,
  list: (params: CampaignListParams) => [...campaignsKeys.all, "list", params] as const,
  details: () => [...campaignsKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignsKeys.details(), id] as const,
};

export function useCampaignsList(params: CampaignListParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: campaignsKeys.list(params),
    queryFn: () => campaignsApi.list(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useCampaignDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: campaignsKeys.detail(id),
    queryFn: () => campaignsApi.details(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) => campaignsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: campaignsKeys.all,
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: campaignsKeys.all,
      });
    },
  });
}
