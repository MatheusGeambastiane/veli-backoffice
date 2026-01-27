export type LessonType = "live" | "asynchronous";

export type DashboardLesson = {
  id: number;
  name: string;
  order: number;
  lesson_type: LessonType;
  support_material: string | null;
  description: string;
  exercise: number;
  content: string | null;
  module: number;
  is_weekly: boolean;
};

export type DashboardModule = {
  id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
};

export type DashboardStudentClass = {
  id: number;
  course_id: number;
  course_name: string;
  start_date: string;
  finish_date: string;
  time: string;
};

export type DashboardClass = {
  id: number;
  lesson: DashboardLesson;
  module: DashboardModule;
  scheduled_datetime: string;
  classroom_link: string | null;
  event_recorded_link: string | null;
  lesson_content: string | null;
  class_notice: string | null;
  created_at: string;
  updated_at: string;
  student_class: DashboardStudentClass;
};

export type StudentsByActiveClass = {
  student_class_id: number;
  course_id: number;
  course_name: string;
  teacher_profile_id: number;
  teacher_name: string;
  start_date: string;
  finish_date: string;
  time: string;
  students_count: number;
};

export type DashboardSummary = {
  total_active_students: number;
  total_active_classes: number;
  next_class: DashboardClass | null;
  week_calendar: DashboardClass[];
  students_by_active_class: StudentsByActiveClass[];
};
