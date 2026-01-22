import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/features/classes/api/classesApi";

export const classesKeys = {
  all: ["classes"] as const,
  list: () => [...classesKeys.all, "list"] as const,
};

export function useClassesList() {
  return useQuery({
    queryKey: classesKeys.list(),
    queryFn: classesApi.list,
    enabled: false,
  });
}
