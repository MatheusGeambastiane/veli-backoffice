import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/features/users/api/usersApi";
import type { UserFormValues } from "@/features/users/schemas/userSchema";
import type { DashboardUsersParams } from "@/features/users/types/dashboardUser";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: () => [...usersKeys.lists()] as const,
  dashboard: () => [...usersKeys.all, "dashboard"] as const,
  dashboardList: (params: DashboardUsersParams) => [...usersKeys.dashboard(), params] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export function useUsersList() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: usersApi.list,
  });
}

export function useDashboardUsersList(params: DashboardUsersParams) {
  return useQuery({
    queryKey: usersKeys.dashboardList(params),
    queryFn: () => usersApi.listDashboard(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useUserById(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserFormValues) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserFormValues) => usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}
