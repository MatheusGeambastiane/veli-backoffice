export type DashboardUserRoleFilter = "student" | "teatcher" | "manager";

export type DashboardLanguage = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string | null;
  image?: string | null;
  lang_icon?: string | null;
};

export type DashboardUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
  profile_pic: string | null;
  languages: Array<DashboardLanguage | string>;
};

export type DashboardUsersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DashboardUser[];
};

export type DashboardUsersParams = {
  search?: string;
  role?: DashboardUserRoleFilter;
  pageSize: number;
  page: number;
};
