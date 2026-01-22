import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@/features/students/api/studentsApi";

export const studentsKeys = {
  all: ["students"] as const,
  list: () => [...studentsKeys.all, "list"] as const,
};

export function useStudentsList() {
  return useQuery({
    queryKey: studentsKeys.list(),
    queryFn: studentsApi.list,
    enabled: false,
  });
}
