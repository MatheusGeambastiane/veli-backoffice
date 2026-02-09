export type SimpleLanguage = {
  id: number;
  name: string;
  lang_icon: string | null;
};

export type Course = {
  id: number;
  name: string;
  language: number;
  level: number;
  description: string | null;
  is_active: boolean;
  modules: number[];
  created_at: string;
  updated_at: string;
};

export type CourseModule = {
  id: number;
  name: string;
  order: number;
  lessons_total: number;
  image?: string | null;
};

export type CourseDetails = {
  id: number;
  name: string;
  language: number;
  language_name: string;
  language_icon: string | null;
  level: number;
  level_name: string;
  student_classes_total: number;
  subscriptions_total: number;
  description: string | null;
  is_active: boolean;
  modules: CourseModule[];
  created_at: string;
  updated_at: string;
};

export type CoursesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Course[];
};

export type LanguageLevel = {
  id: number;
  language: number;
  level: string;
};

export type LanguageLevelsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: LanguageLevel[];
};

export type ModuleListItem = {
  id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
};

export type ModulesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ModuleListItem[];
};

export type CreateModulePayload = {
  name: string;
  order: number;
};

export type UpdateModulePayload = {
  order: number;
};

export type CreateCoursePayload = {
  name: string;
  language: number;
  level: number;
  description: string | null;
  is_active: boolean;
  modules: number[];
};

export type UpdateCoursePayload = {
  name: string;
  language: number;
  level: number;
  description: string | null;
  is_active: boolean;
  modules: number[];
};

export type ModuleDetails = {
  id: number;
  name: string;
  order: number;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: number;
  name: string;
  order: number;
  lesson_type: "live" | "asynchronous";
  support_material: string | null;
  exercise: number | null;
  content: string | null;
  module: number;
  is_weekly: boolean;
};

export type LessonDetails = Omit<Lesson, "exercise"> & {
  exercise: Exercise | null;
  description?: string | null;
};

export type ExerciseQuestion = {
  id: number;
  statement: string;
  statement_type: string;
};

export type Exercise = {
  id: number;
  name: string;
  difficulty_level: "easy" | "medium" | "hard";
  category: "grammar" | "listening" | "pronunciation";
  questions: ExerciseQuestion[];
};

export type ExercisesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Exercise[];
};

export type CoursesParams = {
  search?: string;
  pageSize: number;
  page: number;
  languageIds?: number[];
};
