import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/features/users/api/usersApi";
import type { UserFormValues } from "@/features/users/schemas/userSchema";
import type { CreateDashboardUserValues } from "@/features/users/schemas/createDashboardUserSchema";
import type { DashboardUsersParams } from "@/features/users/types/dashboardUser";
import type {
  DashboardMyProfileUpdatePayload,
  DashboardStudentProfileUpdatePayload,
  DashboardTeacherProfileUpdatePayload,
  DashboardUserCommunicationPayload,
} from "@/features/users/types/dashboardUserDetails";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: () => [...usersKeys.lists()] as const,
  dashboard: () => [...usersKeys.all, "dashboard"] as const,
  dashboardList: (params: DashboardUsersParams) => [...usersKeys.dashboard(), params] as const,
  dashboardDetails: () => [...usersKeys.dashboard(), "detail"] as const,
  dashboardDetail: (id: string) => [...usersKeys.dashboardDetails(), id] as const,
  dashboardCommunications: (id: string) =>
    [...usersKeys.dashboardDetail(id), "communications"] as const,
  dashboardWhatsappTemplates: (id: string) =>
    [...usersKeys.dashboardDetail(id), "whatsapp-templates"] as const,
  myProfile: () => [...usersKeys.dashboard(), "me"] as const,
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

export function useDashboardUserById(id: string, refreshMedia = true) {
  return useQuery({
    queryKey: usersKeys.dashboardDetail(id),
    queryFn: () => usersApi.getDashboardById(id),
    enabled: Boolean(id),
    staleTime: 45 * 60 * 1000,
    refetchInterval: refreshMedia ? 45 * 60 * 1000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: refreshMedia,
  });
}

export function useDashboardUserCommunications(id: string, enabled = true) {
  return useQuery({
    queryKey: usersKeys.dashboardCommunications(id),
    queryFn: () => usersApi.listDashboardUserCommunications(id),
    enabled: Boolean(id) && enabled,
    refetchInterval: (query) =>
      query.state.data?.some((communication) =>
        communication.status === "pending" || communication.status === "processing"
      )
        ? 3000
        : false,
  });
}

export function useDashboardUserWhatsappTemplates(id: string, enabled = true) {
  return useQuery({
    queryKey: usersKeys.dashboardWhatsappTemplates(id),
    queryFn: () => usersApi.listDashboardUserWhatsappTemplates(id),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
}

export function useSendDashboardUserCommunication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DashboardUserCommunicationPayload) =>
      usersApi.sendDashboardUserCommunication(id, payload),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.dashboardCommunications(id) });
    },
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: usersKeys.myProfile(),
    queryFn: usersApi.getMe,
    staleTime: 45 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}

export function useUpdateDashboardUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => usersApi.updateDashboardUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.dashboardDetail(id) });
    },
  });
}

export function useResetDashboardUserPassword(id: string) {
  return useMutation({
    mutationFn: () => usersApi.resetDashboardUserPassword(id),
  });
}

export function useResetMyPassword() {
  return useMutation({
    mutationFn: (payload: { new_password: string }) => usersApi.resetMyPassword(payload),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DashboardMyProfileUpdatePayload) => usersApi.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.myProfile() });
    },
  });
}

export function useUpdateMyProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => usersApi.updateMeProfilePic(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.myProfile() });
    },
  });
}

export function usePatchTeacherProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { profileId: number; data: DashboardTeacherProfileUpdatePayload }) =>
      usersApi.patchTeacherProfile(payload.profileId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.dashboardDetail(userId) });
    },
  });
}

export function usePatchStudentProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { profileId: number; data: DashboardStudentProfileUpdatePayload }) =>
      usersApi.patchStudentProfile(payload.profileId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.dashboardDetail(userId) });
    },
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

export function useCreateDashboardUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDashboardUserValues) => usersApi.createDashboard(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.dashboard() });
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
