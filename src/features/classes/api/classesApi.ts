import { httpClient } from "@/shared/lib/http/http";
import type { Class } from "@/features/classes/types/class";

export const classesApi = {
  list: () => httpClient.get<Class[]>("/api/classes"),
};
