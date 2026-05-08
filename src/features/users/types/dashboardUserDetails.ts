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
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
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
