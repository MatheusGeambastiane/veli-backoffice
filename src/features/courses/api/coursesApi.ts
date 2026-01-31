import { httpClient } from "@/shared/lib/http/http";
import type {
  CreateCoursePayload,
  CreateModulePayload,
  CourseDetails,
  CoursesParams,
  CoursesResponse,
  ExercisesResponse,
  LanguageLevelsResponse,
  Lesson,
  ModuleListItem,
  ModuleDetails,
  ModulesResponse,
  SimpleLanguage,
  UpdateCoursePayload,
  UpdateModulePayload,
  Exercise,
} from "@/features/courses/types/course";

export const coursesApi = {
  listLanguages: () => httpClient.get<SimpleLanguage[]>("/languages/simple/"),
  listLanguageLevels: () => httpClient.get<LanguageLevelsResponse>("/dashboard/language-levels/"),
  listModules: () => httpClient.get<ModulesResponse>("/dashboard/modules/"),
  listCourses: (params: CoursesParams) => {
    const searchParams = new URLSearchParams();

    if (params.search) {
      searchParams.set("search", params.search);
    }

    if (params.languageIds?.length) {
      params.languageIds.forEach((id) => {
        searchParams.append("language", String(id));
      });
    }

    searchParams.set("page_size", String(params.pageSize));
    searchParams.set("page", String(params.page));

    const query = searchParams.toString();
    const path = query ? `/dashboard/courses/?${query}` : "/dashboard/courses/";
    return httpClient.get<CoursesResponse>(path);
  },
  getCourseById: (id: string) => httpClient.get<CourseDetails>(`/dashboard/courses/${id}/`),
  createCourse: (payload: CreateCoursePayload) =>
    httpClient.post<CourseDetails>("/dashboard/courses/", payload),
  createModule: (payload: CreateModulePayload) =>
    httpClient.post<ModuleListItem>("/dashboard/modules/", payload),
  updateCourse: (id: string, payload: UpdateCoursePayload) =>
    httpClient.patch<CourseDetails>(`/dashboard/courses/${id}/`, payload),
  updateModuleOrder: (id: number, payload: UpdateModulePayload) =>
    httpClient.patch<ModuleListItem>(`/dashboard/modules/${id}/`, payload),
  getModuleById: (id: string) => httpClient.get<ModuleDetails>(`/dashboard/modules/${id}/`),
  listModuleLessons: (id: string, params: { search?: string; lessonType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set("search", params.search);
    }
    if (params.lessonType) {
      searchParams.set("lesson_type", params.lessonType);
    }
    const query = searchParams.toString();
    const path = query
      ? `/dashboard/modules/${id}/lessons/?${query}`
      : `/dashboard/modules/${id}/lessons/`;
    return httpClient.get<Lesson[]>(path);
  },
  listExercises: (params: {
    search?: string;
    difficultyLevel?: string;
    category?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.search) {
      searchParams.set("search", params.search);
    }
    if (params.difficultyLevel) {
      searchParams.set("difficulty_level", params.difficultyLevel);
    }
    if (params.category) {
      searchParams.set("category", params.category);
    }
    const query = searchParams.toString();
    const path = query ? `/dashboard/exercises/?${query}` : "/dashboard/exercises/";
    return httpClient.get<ExercisesResponse>(path);
  },
  getExerciseById: (id: string) => httpClient.get<Exercise>(`/dashboard/exercises/${id}/`),
  createLesson: (payload: FormData) => httpClient.post<Lesson>("/dashboard/lessons/", payload),
};
