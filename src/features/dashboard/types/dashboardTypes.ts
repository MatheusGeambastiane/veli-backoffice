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
  teacher_profile_id?: number;
  teacher_name?: string;
  start_date: string;
  finish_date: string;
  time: string;
  classroom_link?: string | null;
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

export type BilledAmountByOffer = {
  offer_id: number;
  offer_name: string;
  total_billed_amount: number;
};

export type BilledAmountByCampaign = {
  campaign_id: number;
  campaign_name: string;
  total_billed_amount: number;
};

export type OrdersLast3Months = {
  month: string;
  total_orders: number;
};

export type DashboardSummary = {
  total_active_students: number;
  total_active_classes: number;
  next_class: DashboardClass | null;
  week_calendar: DashboardClass[];
  students_by_active_class: StudentsByActiveClass[];
  total_active_orders?: number;
  total_pending_orders?: number;
  total_orders_today?: number;
  total_orders_last_7_days?: number;
  total_billed_amount?: number;
  total_billed_amount_today?: number;
  total_billed_amount_last_7_days?: number;
  billed_amount_by_offer?: BilledAmountByOffer[];
  billed_amount_by_campaign?: BilledAmountByCampaign[];
  orders_last_3_months?: OrdersLast3Months[];
};
