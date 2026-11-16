import { z } from "zod";

export const createDashboardUserSchema = z.object({
  first_name: z.string().trim().min(1, "Informe o nome").max(150),
  last_name: z.string().trim().min(1, "Informe o sobrenome").max(150),
  username: z.string().trim().min(1, "Informe o nome de usuário").max(150)
    .regex(/^[\p{L}\p{N}_@.+-]+$/u, "Use apenas letras, números e @/./+/-/_"),
  email: z.string().trim().email("Informe um email válido").max(254),
  phone: z.string().trim().max(32, "Use no máximo 32 caracteres"),
  password: z.string().min(1, "Informe a senha"),
  role: z.enum(["student", "teacher", "administrative", "manager"]),
});

export type CreateDashboardUserValues = z.infer<typeof createDashboardUserSchema>;
