export type StudentClass = {
  id: number;
  course: number;
  course_name: string;
  language_icon_url: string | null;
  teacher_profile: number | null;
  teacher_full_name: string | null;
  teacher_profile_pic_url: string | null;
  total_students: number;
  next_class?: string | ScheduleEvent | null;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentClassDetails = StudentClass & {
  next_class: string | ScheduleEvent | null;
};

export type StudentClassesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentClass[];
};

export type CourseSimple = {
  id: number;
  name: string;
};

export type TeacherProfileSimple = {
  id: number;
  full_name: string;
};

export type SubscriptionStudent = {
  full_name: string;
  user_id: number;
  profile_pic: string | null;
};

export type UserLanguage = {
  id: number;
  name: string;
  lang_icon?: string;
};

export type StudentProfileUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  cpf?: string;
  date_of_birth?: string;
  gender?: string;
  role?: string;
  profile_pic: string | null;
  languages?: UserLanguage[];
  student_profile?: {
    id: number;
    bio?: string | null;
    languages?: UserLanguage[];
  } | null;
  teacher_profile?: unknown | null;
};

export type ClassSubscription = {
  id: number;
  student_profile: number;
  student_class: number;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  student: SubscriptionStudent;
};

export type SubscriptionStatus = "inscrito" | "estudando" | "finalizado" | "desistente";

export type StudentProfileSearchResult = {
  id: number;
  user: StudentProfileUser;
  bio?: string | null;
  languages?: number[];
};

export type CreateSubscriptionPayload = {
  student_profile: number;
  student_class: number;
};

export type UpdateSubscriptionPayload = {
  status: SubscriptionStatus;
};

export type UpdateClassPayload = {
  course: number;
  teacher_profile: number | null;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  is_active: boolean;
  duration: number;
  classroom_link?: string | null;
};

export type StudentProfileSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentProfileSearchResult[];
};

export type ScheduleLesson = {
  id: number;
  name: string;
  order: number;
  lesson_type: "live" | "asynchronous" | string;
  support_material: string | null;
  description: string | null;
  content: string | null;
  is_weekly: boolean;
  exercise: number | null;
  module: number;
};

export type ScheduleModule = {
  id: number;
  name: string;
  order: number;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleEvent = {
  id: number;
  lesson: ScheduleLesson;
  module: ScheduleModule;
  scheduled_datetime: string;
  classroom_link: string;
  event_recorded_link: string;
  lesson_content: string | null;
  class_notice: string;
  created_at: string;
  updated_at: string;
};

export type ClassSchedule = {
  id: number;
  student_class: number;
  schedule_id: number;
  events: ScheduleEvent[];
  created_at: string;
  updated_at: string;
};

export type GenerateSchedulePayload = {
  student_class: number;
};

export type GenerateScheduleResponse = {
  detail: string;
};

export type DoubtAnswer = {
  id: number;
  comment: string;
  teacher_profile: number;
  teacher_name: string;
  teacher_profile_pic: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonDoubt = {
  id: number;
  registration: number;
  student_profile_id: number;
  student_class_id: number;
  student_full_name: string;
  student_profile_pic: string | null;
  lesson: number;
  lesson_name: string;
  comment: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  doubt_answers: DoubtAnswer[];
};

export type CreateDoubtAnswerPayload = {
  lesson_doubt: number;
  comment: string;
};
