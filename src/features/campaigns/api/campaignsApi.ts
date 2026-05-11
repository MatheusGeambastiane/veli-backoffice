import { httpClient } from "@/shared/lib/http/http";
import type {
  CampaignDetail,
  CampaignListParams,
  CampaignListResponse,
  CreateCampaignPayload,
} from "@/features/campaigns/types/campaign";

export const campaignsApi = {
  list: (params: CampaignListParams) => {
    const searchParams = new URLSearchParams();

    if (params.name) {
      searchParams.set("name", params.name);
    }

    if (params.page) {
      searchParams.set("page", String(params.page));
    }

    if (params.pageSize) {
      searchParams.set("page_size", String(params.pageSize));
    }

    const query = searchParams.toString();
    const path = query ? `/dashboard/campaigns/?${query}` : "/dashboard/campaigns/";
    return httpClient.get<CampaignListResponse>(path);
  },
  create: (payload: CreateCampaignPayload) =>
    httpClient.post<CampaignDetail>("/dashboard/campaigns/", payload),
  details: (id: string) => httpClient.get<CampaignDetail>(`/dashboard/campaigns/${id}/`),
  remove: (id: number) => httpClient.delete<void>(`/dashboard/campaigns/${id}/`),
};
