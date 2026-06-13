import { httpClient } from "@/shared/lib/http/http";
import type {
  CreateOfferPayload,
  OfferDetail,
  OfferListParams,
  OfferListResponse,
  SimpleOfferCampaign,
  SimpleOfferClass,
  SimpleOfferCourse,
  UpdateOfferPayload,
} from "@/features/offers/types/offer";

export const offersApi = {
  list: (params: OfferListParams) => {
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
    const path = query ? `/dashboard/offers/?${query}` : "/dashboard/offers/";
    return httpClient.get<OfferListResponse>(path);
  },
  details: (id: string) => httpClient.get<OfferDetail>(`/dashboard/offers/${id}/`),
  coursesSimple: () => httpClient.get<SimpleOfferCourse[]>("/dashboard/courses/simple/"),
  campaignsSimple: () => httpClient.get<SimpleOfferCampaign[]>("/dashboard/campaigns/simple/"),
  studentClassesSimple: (params?: { course?: number }) => {
    const searchParams = new URLSearchParams();

    if (params?.course) {
      searchParams.set("course", String(params.course));
    }

    const query = searchParams.toString();
    const path = query
      ? `/dashboard/student-classes/simple/?${query}`
      : "/dashboard/student-classes/simple/";
    return httpClient.get<SimpleOfferClass[]>(path);
  },
  create: (payload: CreateOfferPayload) => httpClient.post("/dashboard/offers/", payload),
  update: (id: string, payload: UpdateOfferPayload) =>
    httpClient.patch<OfferDetail>(`/dashboard/offers/${id}/`, payload),
};
