import { httpClient } from "@/shared/lib/http/http";
import type {
  CreateOfferPayload,
  OfferDetail,
  OfferListParams,
  OfferListResponse,
  SimpleOfferClass,
  SimpleOfferCourse,
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
  studentClassesSimple: () =>
    httpClient.get<SimpleOfferClass[]>("/dashboard/student-classes/simple/"),
  create: (payload: CreateOfferPayload) => httpClient.post("/dashboard/offers/", payload),
};
