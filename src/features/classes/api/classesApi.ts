import { httpClient } from "@/shared/lib/http/http";
import type {
  ClassSubscription,
  CreateSubscriptionPayload,
  StudentProfileSearchResponse,
  StudentClassDetails,
  StudentClassesResponse,
  UpdateSubscriptionPayload,
} from "@/features/classes/types/class";

export const classesApi = {
  list: (params: { search?: string; is_active?: string; page_size?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set("search", params.search);
    }
    if (params.is_active) {
      searchParams.set("is_active", params.is_active);
    }
    if (params.page_size) {
      searchParams.set("page_size", String(params.page_size));
    }
    const query = searchParams.toString();
    const path = query
      ? `/dashboard/student-classes/?${query}`
      : "/dashboard/student-classes/";
    return httpClient.get<StudentClassesResponse>(path);
  },
  details: (id: string) => {
    return httpClient.get<StudentClassDetails>(`/dashboard/student-classes/${id}/`);
  },
  subscriptionsByClass: (id: string, params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) {
      searchParams.set("search", params.search);
    }
    const query = searchParams.toString();
    const path = query
      ? `/dashboard/subscriptions/by_class/${id}/?${query}`
      : `/dashboard/subscriptions/by_class/${id}/`;
    return httpClient.get<ClassSubscription[]>(path);
  },
  searchStudentProfiles: (search: string) => {
    const searchParams = new URLSearchParams();
    if (search) {
      searchParams.set("search", search);
    }
    const query = searchParams.toString();
    const path = query ? `/dashboard/student-profiles/?${query}` : "/dashboard/student-profiles/";
    return httpClient.get<StudentProfileSearchResponse>(path);
  },
  createSubscription: (payload: CreateSubscriptionPayload) => {
    return httpClient.post<ClassSubscription>("/dashboard/subscriptions/", payload);
  },
  updateSubscriptionStatus: (id: number, payload: UpdateSubscriptionPayload) => {
    return httpClient.patch<ClassSubscription>(`/dashboard/subscriptions/${id}/`, payload);
  },
  deleteSubscription: (id: number) => {
    return httpClient.delete<void>(`/dashboard/subscriptions/${id}/`);
  },
};
