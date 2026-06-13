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
  is_generic: boolean;
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

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CourseSimple = {
  id: number;
  name: string;
};

export type TeacherProfileSimple = {
  id: number;
  full_name: string;
};

export type CreateStudentClassPayload = {
  course: number;
  teacher_profile: number;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  is_generic: boolean;
};

export type SubscriptionStudent = {
  full_name: string;
  user_id: number;
  profile_pic: string | null;
};

export type SubscriptionDetailsStudent = {
  student_profile_id: number;
  user_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
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

export type UserAddress = {
  id: number;
  street: string | null;
  address_number: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type SubscriptionDetailsUser = Omit<StudentProfileUser, "profile_pic"> & {
  phone: string | null;
  profile_pic: string | null;
  address: UserAddress | null;
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

export type SubscriptionContract = {
  id: number;
  user: number;
  order: number;
  offer: number;
  student_class: number;
  status: string;
  signed_at: string | null;
  activated_at: string | null;
  canceled_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  terms_snapshot: Record<string, unknown> | null;
  contract_file: string | null;
  contract_file_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

export type SubscriptionOrder = {
  id: number;
  user: number;
  offer: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  class_preference: number | null;
  preference_period: unknown[];
  payment_mode: string | null;
  payment_type: string | null;
  payment_installments: number | null;
  billing_day: number | null;
  next_billing_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

export type SubscriptionOffer = {
  id: number;
  name: string;
  price: number;
  plan_type: string;
  access_duration_days: number;
};

export type SubscriptionEventProgress = {
  id: number;
  scheduled_datetime: string;
  lesson: {
    id: number;
    name: string;
  };
  module: {
    id: number;
    name: string;
  };
  watched: boolean;
  watched_at: string | null;
  rating: number | null;
  comment: string | null;
};

export type SubscriptionEventsSummary = {
  total_events: number;
  watched_events: number;
  unwatched_events: number;
  items: SubscriptionEventProgress[];
};

export type SubscriptionCharge = {
  id: number;
  status: string;
  origin: string;
  billing_method: string;
  amount_gross: number;
  amount_net: number;
  fee_amount: number;
  installments: number | null;
  due_date: string | null;
  paid_at: string | null;
  receipt_url: string | null;
};

export type SubscriptionPaymentCycle = {
  cycle_number: number;
  charge_id: number;
  origin: string;
  paid_at: string | null;
  amount: number;
  receipt_url: string | null;
};

export type SubscriptionBilling = {
  order_id: number;
  payment_mode: string | null;
  payment_type: string | null;
  order_status: string;
  checkout_status: string;
  is_paid: boolean;
  total_paid_amount: number;
  charges: SubscriptionCharge[];
  receipts: string[];
  monthly?: {
    cycles_paid: number;
    paid_cycles: SubscriptionPaymentCycle[];
    payoff: SubscriptionPaymentCycle[];
  } | null;
};

export type SubscriptionPayment = Partial<SubscriptionCharge> & {
  id?: number;
  amount?: number;
  created_at?: string;
  updated_at?: string;
};

export type ClassSubscriptionDetails = Omit<ClassSubscription, "student"> & {
  contract: SubscriptionContract | null;
  student: SubscriptionDetailsStudent;
  user: SubscriptionDetailsUser;
  order: SubscriptionOrder | null;
  payments: SubscriptionPayment[];
  offer: SubscriptionOffer | null;
  events: SubscriptionEventsSummary;
  billing: SubscriptionBilling | null;
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
  is_generic: boolean;
  duration: number;
  classroom_link?: string | null;
};

export type StudentProfileSearchResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentProfileSearchResult[];
};

export type DailyActivity = {
  id: number;
  name: string;
  statement: string;
  category: string;
  activity_type?: string;
  video_yt_link?: string | null;
  file?: string | null;
  available_on?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
};

export type DailyActivitiesResponse = PaginatedResponse<DailyActivity>;

export type MonthActivityListItem = {
  id: number;
  student_class: number;
  student_class_name: string;
  month: string;
  daily_activities: number[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

export type MonthActivitiesResponse = PaginatedResponse<MonthActivityListItem>;

export type MonthActivityDetails = Omit<MonthActivityListItem, "daily_activities"> & {
  daily_activities: Pick<DailyActivity, "id" | "name" | "statement">[];
};

export type CreateMonthActivityPayload = {
  student_class: number;
  month: string;
  daily_activities: number[];
};

export type UpdateMonthActivityPayload = {
  month: string;
  daily_activities: number[];
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
