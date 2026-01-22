export type UserRole = "admin" | "staff";
export type UserStatus = "active" | "inactive";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
