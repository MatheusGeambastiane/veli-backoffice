import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido"),
  password: z.string().min(6, "Informe ao menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
