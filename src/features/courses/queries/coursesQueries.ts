import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/features/courses/api/coursesApi";
import type {
  CoursesParams,
  CreateCoursePayload,
  CreateModulePayload,
  Exercise,
  ExercisesResponse,
  Lesson,
  ModuleDetails,
  UpdateCoursePayload,
  UpdateModulePayload,
} from "@/features/courses/types/course";

export const coursesKeys = {
  all: ["courses"] as const,
  languages: () => [...coursesKeys.all, "languages"] as const,
  languageLevels: () => [...coursesKeys.all, "language-levels"] as const,
  modules: () => [...coursesKeys.all, "modules"] as const,
  moduleDetails: () => [...coursesKeys.all, "module-detail"] as const,
  moduleDetail: (id: string) => [...coursesKeys.moduleDetails(), id] as const,
  moduleLessons: () => [...coursesKeys.all, "module-lessons"] as const,
  moduleLessonsList: (id: string, params: { search?: string; lessonType?: string }) => [
    ...coursesKeys.moduleLessons(),
    id,
    params,
  ],
  exercises: () => [...coursesKeys.all, "exercises"] as const,
  exercisesList: (params: { search?: string; difficultyLevel?: string; category?: string }) => [
    ...coursesKeys.exercises(),
    params,
  ],
  exerciseDetails: () => [...coursesKeys.all, "exercise-detail"] as const,
  exerciseDetail: (id: string) => [...coursesKeys.exerciseDetails(), id] as const,
  exercisesSimple: () => [...coursesKeys.all, "exercises-simple"] as const,
  lessonDetails: () => [...coursesKeys.all, "lesson-detail"] as const,
  lessonDetail: (id: string) => [...coursesKeys.lessonDetails(), id] as const,
  lists: () => [...coursesKeys.all, "list"] as const,
  list: (params: CoursesParams) => [...coursesKeys.lists(), params] as const,
  details: () => [...coursesKeys.all, "detail"] as const,
  detail: (id: string) => [...coursesKeys.details(), id] as const,
};

export function useLanguagesSimple() {
  return useQuery({
    queryKey: coursesKeys.languages(),
    queryFn: coursesApi.listLanguages,
  });
}

export function useCoursesList(params: CoursesParams) {
  return useQuery({
    queryKey: coursesKeys.list(params),
    queryFn: () => coursesApi.listCourses(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useLanguageLevels() {
  return useQuery({
    queryKey: coursesKeys.languageLevels(),
    queryFn: coursesApi.listLanguageLevels,
  });
}

export function useModulesList() {
  return useQuery({
    queryKey: coursesKeys.modules(),
    queryFn: coursesApi.listModules,
  });
}

export function useCourseDetails(id: string) {
  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: () => coursesApi.getCourseById(id),
    enabled: Boolean(id),
  });
}

export function useModuleDetails(id: string) {
  return useQuery({
    queryKey: coursesKeys.moduleDetail(id),
    queryFn: () => coursesApi.getModuleById(id),
    enabled: Boolean(id),
  });
}

export function useModuleLessons(
  id: string,
  params: { search?: string; lessonType?: string }
) {
  return useQuery({
    queryKey: coursesKeys.moduleLessonsList(id, params),
    queryFn: () => coursesApi.listModuleLessons(id, params),
    enabled: Boolean(id),
    placeholderData: (previousData: Lesson[] | undefined) => previousData,
  });
}

export function useExercisesList(params: {
  search?: string;
  difficultyLevel?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: coursesKeys.exercisesList(params),
    queryFn: () => coursesApi.listExercises(params),
    placeholderData: (previousData: ExercisesResponse | undefined) => previousData,
  });
}

export function useExercisesSimpleList(enabled = true) {
  return useQuery({
    queryKey: coursesKeys.exercisesSimple(),
    queryFn: () => coursesApi.listExercisesSimple(),
    enabled,
  });
}

export function useExerciseDetails(id: string) {
  return useQuery({
    queryKey: coursesKeys.exerciseDetail(id),
    queryFn: () => coursesApi.getExerciseById(id),
    enabled: Boolean(id),
  });
}

export function useLessonDetails(id: string) {
  return useQuery({
    queryKey: coursesKeys.lessonDetail(id),
    queryFn: () => coursesApi.getLessonById(id),
    enabled: Boolean(id),
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => coursesApi.createLesson(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.moduleLessons() });
    },
  });
}

export function useUpdateLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => coursesApi.updateLesson(lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.lessonDetails() });
      queryClient.invalidateQueries({ queryKey: coursesKeys.moduleLessons() });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => coursesApi.createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.lists() });
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModulePayload) => coursesApi.createModule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.modules() });
    },
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) => coursesApi.updateCourse(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: coursesKeys.lists() });
    },
  });
}

export function useUpdateModuleOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: number; data: UpdateModulePayload }) =>
      coursesApi.updateModuleOrder(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.modules() });
    },
  });
}
