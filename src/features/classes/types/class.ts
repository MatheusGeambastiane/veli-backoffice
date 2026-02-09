export type StudentClass = {
  id: number;
  course: number;
  course_name: string;
  language_icon_url: string | null;
  teacher_profile: number | null;
  teacher_full_name: string | null;
  teacher_profile_pic_url: string | null;
  total_students: number;
  next_class?: string | null;
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
  next_class: string | null;
};

export type StudentClassesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentClass[];
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

export type StudentProfileSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentProfileSearchResult[];
};
