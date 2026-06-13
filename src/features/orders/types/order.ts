export type OrderPreferencePeriod = "morning" | "afternoon" | "night" | "no_preference";

export type OrderListParams = {
  search?: string;
  status?: string;
  isGeneric?: boolean;
  preferencePeriod?: OrderPreferencePeriod[];
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  pageSize?: number;
};

export type OrderUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
};

export type OrderClassPreference = {
  id: number;
  course: number;
  course_name: string;
  language_icon: string | null;
  teacher_profile: number | null;
  teacher_full_name: string | null;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  duration: number;
  classroom_link: string | null;
  is_active: boolean;
  is_generic: boolean;
};

export type OrderBillingOption = {
  id: number;
  name: string;
};

export type OrderListItem = {
  id: number;
  user: OrderUser;
  class_preference: OrderClassPreference | null;
  status: string;
  offer_price: string;
  created_at: string;
  billing_option: OrderBillingOption | null;
};

export type OrderListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderListItem[];
};
