import { httpClient } from "@/shared/lib/http/http";
import type {
  ClassSubscription,
  ClassSubscriptionDetails,
  CreateSubscriptionPayload,
  CreateMonthActivityPayload,
  CreateStudentClassPayload,
  CourseSimple,
  ClassSchedule,
  DailyActivitiesResponse,
  GenerateSchedulePayload,
  GenerateScheduleResponse,
  LessonDoubt,
  MonthActivitiesResponse,
  MonthActivityDetails,
  DoubtAnswer,
  StudentProfileSearchResponse,
  StudentClassDetails,
  StudentClassesResponse,
  TeacherProfileSimple,
  CreateDoubtAnswerPayload,
  UpdateClassPayload,
  UpdateMonthActivityPayload,
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
    const path = query ? `/dashboard/student-classes/?${query}` : "/dashboard/student-classes/";
    return httpClient.get<StudentClassesResponse>(path);
  },
  details: (id: string) => {
    return httpClient.get<StudentClassDetails>(`/dashboard/student-classes/${id}/`);
  },
  update: (id: string, payload: UpdateClassPayload) => {
    return httpClient.patch<StudentClassDetails>(`/dashboard/student-classes/${id}/`, payload);
  },
  coursesSimple: () => {
    return httpClient.get<CourseSimple[]>("/dashboard/courses/simple/");
  },
  teacherProfilesSimple: () => {
    return httpClient.get<TeacherProfileSimple[]>("/dashboard/teacher-profiles/simple/");
  },
  create: (payload: CreateStudentClassPayload) => {
    return httpClient.post<StudentClassDetails>("/dashboard/student-classes/", payload);
  },
  scheduleByClass: (id: string) => {
    return httpClient.get<ClassSchedule>(`/dashboard/schedules/by_class/${id}/`);
  },
  hasSchedule: (id: string) => {
    return httpClient.get<boolean>(`/dashboard/student-classes/${id}/has-schedule/`);
  },
  generateSchedule: (payload: GenerateSchedulePayload) => {
    return httpClient.post<GenerateScheduleResponse>("/dashboard/schedules/generate/", payload);
  },
  eventDetails: (id: string) => {
    return httpClient.get<ClassSchedule["events"][number]>(`/dashboard/events/${id}/`);
  },
  updateEvent: (id: string, payload: FormData) => {
    return httpClient.patch<ClassSchedule["events"][number]>(`/dashboard/events/${id}/`, payload);
  },
  lessonDoubtsByClass: (id: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("student_class", id);
    return httpClient.get<LessonDoubt[]>(`/dashboard/lesson-doubts/?${searchParams.toString()}`);
  },
  monthActivitiesByClass: (id: string) => {
    return httpClient.get<MonthActivitiesResponse>(
      `/dashboard/month-activities/student-class/${id}/`,
    );
  },
  monthActivityDetails: (id: string) => {
    return httpClient.get<MonthActivityDetails>(`/dashboard/month-activities/${id}/`);
  },
  dailyActivities: (params: { search?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set("search", params.search);
    }
    if (params.page && params.page > 1) {
      searchParams.set("page", String(params.page));
    }
    const query = searchParams.toString();
    const path = query ? `/dashboard/daily-activities/?${query}` : "/dashboard/daily-activities/";
    return httpClient.get<DailyActivitiesResponse>(path);
  },
  createMonthActivity: (payload: CreateMonthActivityPayload) => {
    return httpClient.post<MonthActivityDetails>("/dashboard/month-activities/", payload);
  },
  updateMonthActivity: (id: string, payload: UpdateMonthActivityPayload) => {
    return httpClient.patch<MonthActivityDetails>(`/dashboard/month-activities/${id}/`, payload);
  },
  createDoubtAnswer: (payload: CreateDoubtAnswerPayload) => {
    return httpClient.post<DoubtAnswer>("/dashboard/doubt-answers/", payload);
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
  subscriptionDetails: (id: string) => {
    return httpClient.get<ClassSubscriptionDetails>(`/dashboard/subscriptions/${id}/`);
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
