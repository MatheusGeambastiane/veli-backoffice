import { httpClient } from "@/shared/lib/http/http";
import type { User } from "@/features/users/types/user";
import type { UserFormValues } from "@/features/users/schemas/userSchema";

export const usersApi = {
  list: () => httpClient.get<User[]>("/api/users"),
  getById: (id: string) => httpClient.get<User>(`/api/users/${id}`),
  create: (payload: UserFormValues) => httpClient.post<User>("/api/users", payload),
  update: (id: string, payload: UserFormValues) =>
    httpClient.put<User>(`/api/users/${id}`, payload),
  remove: (id: string) => httpClient.delete<void>(`/api/users/${id}`),
};
