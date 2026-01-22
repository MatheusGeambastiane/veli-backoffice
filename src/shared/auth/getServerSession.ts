import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth";

export function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}
