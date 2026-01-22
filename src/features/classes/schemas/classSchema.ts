import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(2, "Informe um nome"),
  level: z.enum(["basic", "intermediate", "advanced"]),
  status: z.enum(["active", "inactive"]),
});

export type ClassFormValues = z.infer<typeof classSchema>;
