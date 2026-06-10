import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { classesApi } from "@/features/classes/api/classesApi";

export const classesKeys = {
  all: ["classes"] as const,
  list: (params: { search?: string; is_active?: string; page_size?: number }) =>
    [...classesKeys.all, "list", params] as const,
  details: (id: string) => [...classesKeys.all, "details", id] as const,
  coursesSimple: () => [...classesKeys.all, "courses-simple"] as const,
  teacherProfilesSimple: () => [...classesKeys.all, "teacher-profiles-simple"] as const,
  scheduleByClass: (id: string) => [...classesKeys.all, "schedule-by-class", id] as const,
  hasSchedule: (id: string) => [...classesKeys.all, "has-schedule", id] as const,
  lessonDoubtsByClass: (id: string) => [...classesKeys.all, "lesson-doubts-by-class", id] as const,
  monthActivitiesByClass: (id: string) =>
    [...classesKeys.all, "month-activities-by-class", id] as const,
  monthActivityDetails: (id: string) => [...classesKeys.all, "month-activity-details", id] as const,
  dailyActivities: (params: { search?: string; page?: number }) =>
    [...classesKeys.all, "daily-activities", params] as const,
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
  const enabled = status === "authenticated";

  return useQuery({
    queryKey: classesKeys.coursesSimple(),
    queryFn: () => classesApi.coursesSimple(),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCoursesSimpleOnDemand(enabled: boolean) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.coursesSimple(),
    queryFn: () => classesApi.coursesSimple(),
    enabled: status === "authenticated" && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useTeacherProfilesSimple() {
  const { status } = useSession();
  const enabled = status === "authenticated";

  return useQuery({
    queryKey: classesKeys.teacherProfilesSimple(),
    queryFn: () => classesApi.teacherProfilesSimple(),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useTeacherProfilesSimpleOnDemand(enabled: boolean) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.teacherProfilesSimple(),
    queryFn: () => classesApi.teacherProfilesSimple(),
    enabled: status === "authenticated" && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useScheduleByClass(id: string, enabled = true) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.scheduleByClass(id),
    queryFn: () => classesApi.scheduleByClass(id),
    enabled: status === "authenticated" && Boolean(id) && enabled,
  });
}

export function useHasSchedule(id: string) {
  return useMutation({
    mutationFn: () => classesApi.hasSchedule(id),
  });
}

export function useGenerateSchedule() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.generateSchedule>[0]) =>
      classesApi.generateSchedule(payload),
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

export function useLessonDoubtsByClass(id: string, enabled = true) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.lessonDoubtsByClass(id),
    queryFn: () => classesApi.lessonDoubtsByClass(id),
    enabled: status === "authenticated" && Boolean(id) && enabled,
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

export function useMonthActivitiesByClass(id: string, enabled = true) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.monthActivitiesByClass(id),
    queryFn: () => classesApi.monthActivitiesByClass(id),
    enabled: status === "authenticated" && Boolean(id) && enabled,
  });
}

export function useMonthActivityDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.monthActivityDetails(id),
    queryFn: () => classesApi.monthActivityDetails(id),
    enabled: status === "authenticated" && Boolean(id),
  });
}

export function useDailyActivities(params: { search?: string; page?: number }, enabled = true) {
  const { status } = useSession();

  return useQuery({
    queryKey: classesKeys.dailyActivities(params),
    queryFn: () => classesApi.dailyActivities(params),
    enabled: status === "authenticated" && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMonthActivity(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.createMonthActivity>[0]) =>
      classesApi.createMonthActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.monthActivitiesByClass(classId),
      });
    },
  });
}

export function useUpdateMonthActivity(classId: string, monthActivityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.updateMonthActivity>[1]) =>
      classesApi.updateMonthActivity(monthActivityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classesKeys.monthActivitiesByClass(classId),
      });
      queryClient.invalidateQueries({
        queryKey: classesKeys.monthActivityDetails(monthActivityId),
      });
    },
  });
}

export function useClassSubscriptions(
  params: { classId: string; search?: string },
  enabled = true,
) {
  const { status } = useSession();

  return useQuery({
    queryKey: [...classesKeys.details(params.classId), "subscriptions", params.search],
    queryFn: () => classesApi.subscriptionsByClass(params.classId, { search: params.search }),
    enabled: status === "authenticated" && Boolean(params.classId) && enabled,
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
    mutationFn: (payload: {
      id: number;
      status: "inscrito" | "estudando" | "finalizado" | "desistente";
    }) => classesApi.updateSubscriptionStatus(payload.id, { status: payload.status }),
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

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof classesApi.create>[0]) => classesApi.create(payload),
    onSuccess: () => {
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
