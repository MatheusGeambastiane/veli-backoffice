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
  coursesSimple: () => [...classesKeys.all, "courses-simple"] as const,
  teacherProfilesSimple: () => [...classesKeys.all, "teacher-profiles-simple"] as const,
  scheduleByClass: (id: string) => [...classesKeys.all, "schedule-by-class", id] as const,
  lessonDoubtsByClass: (id: string) => [...classesKeys.all, "lesson-doubts-by-class", id] as const,
  eventDetails: (id: string) => [...classesKeys.all, "event-details", id] as const,
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

export function useCoursesSimple() {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.coursesSimple(),
    queryFn: () => classesApi.coursesSimple(),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useTeacherProfilesSimple() {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.teacherProfilesSimple(),
    queryFn: () => classesApi.teacherProfilesSimple(),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useScheduleByClass(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.scheduleByClass(id),
    queryFn: () => classesApi.scheduleByClass(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.generateSchedule>[0]) =>
      classesApi.generateSchedule(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.scheduleByClass(String(variables.student_class)),
      });
    },
  });
}

export function useEventDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.eventDetails(id),
    queryFn: () => classesApi.eventDetails(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useUpdateEvent(classId: string, eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => classesApi.updateEvent(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.eventDetails(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: classesKeys.scheduleByClass(classId),
      });
      queryClient.invalidateQueries({
        queryKey: classesKeys.details(classId),
      });
    },
  });
}

export function useLessonDoubtsByClass(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.lessonDoubtsByClass(id),
    queryFn: () => classesApi.lessonDoubtsByClass(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useCreateDoubtAnswer(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { lesson_doubt: number; comment: string }) =>
      classesApi.createDoubtAnswer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.lessonDoubtsByClass(classId),
      });
    },
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

export function useUpdateClassDetails(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.update>[1]) =>
      classesApi.update(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.details(classId),
      });
      queryClient.invalidateQueries({
        queryKey: classesKeys.all,
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
