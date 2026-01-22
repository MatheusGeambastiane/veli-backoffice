import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2, "Informe um nome"),
  email: z.string().email("Informe um email valido"),
  status: z.enum(["active", "inactive"]),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
