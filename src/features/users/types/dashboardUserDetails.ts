export type DashboardUserLanguage = {
  id: number;
  name: string;
  lang_icon: string | null;
};

export type DashboardStudentProfileLanguage = {
  id: number;
  name: string;
};

export type DashboardStudentProfile = {
  id: number;
  bio: string | null;
  languages: DashboardStudentProfileLanguage[];
};

export type DashboardTeacherProfileLanguage = {
  id: number;
  name: string;
};

export type DashboardTeacherLangLevel = {
  id: number;
  level: string;
  language: DashboardTeacherProfileLanguage;
};

export type DashboardTeacherProfile = {
  id: number;
  hourly_rate: string | null;
  lang_levels: DashboardTeacherLangLevel[];
  bio: string | null;
  cnpj: string | null;
};

export type DashboardUserAddress = {
  id: number;
  zip_code: string | null;
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type DashboardUserOrder = {
  id: number;
  offer: number;
  offer_name: string;
  status: string;
  status_display: string;
  checkout_status: string;
  created_at: string;
};

export type DashboardUserStudentClass = {
  id: number;
  name: string;
  course: number;
  course_name: string;
  start_date: string;
  finish_date: string;
  time: string;
  days_of_week: string[];
  is_active: boolean;
};

export type DashboardUserSubscription = {
  id: number;
  status: string;
  status_display: string;
  student_class: DashboardUserStudentClass;
  created_at: string;
};

export type DashboardUserDetails = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  cpf: string | null;
  date_of_birth: string | null;
  gender: string | null;
  role: string;
  profile_pic: string | null;
  languages: DashboardUserLanguage[];
  address?: DashboardUserAddress | null;
  student_profile: DashboardStudentProfile | null;
  teacher_profile: DashboardTeacherProfile | null;
  orders?: DashboardUserOrder[];
  subscriptions?: DashboardUserSubscription[];
};

export type DashboardUserUpdatePayload = {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  cpf?: string;
  date_of_birth?: string;
  gender?: string;
  role?: string;
  password?: string;
};

export type DashboardMyProfileUpdatePayload = {
  user: DashboardUserUpdatePayload;
  address?: {
    zip_code: string | null;
    street: string | null;
    address_number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
  teacher_profile?: {
    hourly_rate: string | null;
    lang_levels: number[];
    bio: string | null;
    cnpj: string | null;
  } | null;
};

export type DashboardTeacherProfileUpdatePayload = {
  user_id: number;
  hourly_rate: string | null;
  lang_levels: number[];
  bio: string | null;
  cnpj: string | null;
};

export type DashboardStudentProfileUpdatePayload = {
  user_id: number;
  bio: string | null;
  languages: number[];
};

export type DashboardResetPasswordResponse = {
  detail: string;
  user_id: number;
};

export type DashboardUserCommunication = {
  id: number;
  message_type: "template" | "text";
  template_name: string;
  recipient_phone: string;
  subject: string;
  body_text: string;
  status: "pending" | "processing" | "sent" | "failed";
  created_at: string;
  sent_at: string | null;
  failed_at: string | null;
  last_error: string;
};

export type DashboardUserCommunicationPayload =
  | {
      message_type: "template";
      template_name: string;
      template_language: string;
      template_params: string[];
    }
  | { message_type: "text"; message: string };

export type DashboardWhatsappTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  preview: string;
  parameter_count: number;
  uses_automatic_parameters: boolean;
};
