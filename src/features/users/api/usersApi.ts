import { httpClient } from "@/shared/lib/http/http";
import type { User } from "@/features/users/types/user";
import type { UserFormValues } from "@/features/users/schemas/userSchema";
import type { DashboardUsersParams, DashboardUsersResponse } from "@/features/users/types/dashboardUser";

export const usersApi = {
  list: () => httpClient.get<User[]>("/api/users"),
  listDashboard: (params: DashboardUsersParams) => {
    const searchParams = new URLSearchParams();

    if (params.search) {
      searchParams.set("search", params.search);
    }

    if (params.role) {
      searchParams.set("role", params.role);
    }

    searchParams.set("page_size", String(params.pageSize));
    searchParams.set("page", String(params.page));

    const query = searchParams.toString();
    const path = query ? `/dashboard/users/?${query}` : "/dashboard/users/";
    return httpClient.get<DashboardUsersResponse>(path);
  },
  getById: (id: string) => httpClient.get<User>(`/api/users/${id}`),
  create: (payload: UserFormValues) => httpClient.post<User>("/api/users", payload),
  update: (id: string, payload: UserFormValues) =>
    httpClient.put<User>(`/api/users/${id}`, payload),
  remove: (id: string) => httpClient.delete<void>(`/api/users/${id}`),
};
