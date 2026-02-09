import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { classesApi } from "@/features/classes/api/classesApi";

export const classesKeys = {
  all: ["classes"] as const,
  list: (params: { search?: string; is_active?: string; page_size?: number }) => [
    ...classesKeys.all,
    "list",
    params,
  ] as const,
  details: (id: string) => [...classesKeys.all, "details", id] as const,
};

export function useClassesList(params: {
  search?: string;
  is_active?: string;
  page_size?: number;
}) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.list(params),
    queryFn: () => classesApi.list(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useClassDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.details(id),
    queryFn: () => classesApi.details(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useClassSubscriptions(params: { classId: string; search?: string }) {
  const { status } = useSession();

  return useQuery({
    queryKey: [...classesKeys.details(params.classId), "subscriptions", params.search],
    queryFn: () => classesApi.subscriptionsByClass(params.classId, { search: params.search }),
    enabled: status === "authenticated" && Boolean(params.classId),
    placeholderData: (previousData) => previousData,
  });
}

export function useSearchStudentProfiles() {
  return useMutation({
    mutationFn: (search: string) => classesApi.searchStudentProfiles(search),
  });
}

export function useCreateClassSubscription(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { student_profile: number }) =>
      classesApi.createSubscription({ ...payload, student_class: Number(classId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...classesKeys.details(classId), "subscriptions"],
      });
    },
  });
}

export function useUpdateSubscriptionStatus(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number; status: "inscrito" | "estudando" | "finalizado" | "desistente" }) =>
      classesApi.updateSubscriptionStatus(payload.id, { status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...classesKeys.details(classId), "subscriptions"],
      });
    },
  });
}

export function useDeleteSubscription(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => classesApi.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...classesKeys.details(classId), "subscriptions"],
      });
    },
  });
}
