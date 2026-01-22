import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Informe um nome"),
  email: z.string().email("Informe um email valido"),
  role: z.enum(["admin", "staff"]),
  status: z.enum(["active", "inactive"]),
});

export type UserFormValues = z.infer<typeof userSchema>;
