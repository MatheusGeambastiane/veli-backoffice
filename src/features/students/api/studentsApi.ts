import { httpClient } from "@/shared/lib/http/http";
import type { Student } from "@/features/students/types/student";

export const studentsApi = {
  list: () => httpClient.get<Student[]>("/api/students"),
};
