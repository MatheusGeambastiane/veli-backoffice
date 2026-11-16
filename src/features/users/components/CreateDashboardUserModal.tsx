"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { createDashboardUserSchema, type CreateDashboardUserValues } from "@/features/users/schemas/createDashboardUserSchema";
import { useCreateDashboardUser } from "@/features/users/queries/usersQueries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { HttpError } from "@/shared/lib/http/http";

const fields = [
  { name: "first_name", label: "Nome", autoComplete: "given-name" },
  { name: "last_name", label: "Sobrenome", autoComplete: "family-name" },
  { name: "username", label: "Nome de usuário", autoComplete: "username" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Telefone (opcional)", type: "tel", autoComplete: "tel" },
  { name: "password", label: "Senha", type: "password", autoComplete: "new-password" },
] as const;

export function CreateDashboardUserModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const createUser = useCreateDashboardUser();
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<CreateDashboardUserValues>({
    resolver: zodResolver(createDashboardUserSchema),
    defaultValues: { first_name: "", last_name: "", username: "", email: "", phone: "", password: "", role: "student" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  async function onSubmit(values: CreateDashboardUserValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearErrors("root");
    try {
      await createUser.mutateAsync(values);
      onCreated();
    } catch (error) {
      setError("root", { message: "Não foi possível criar o usuário. Confira os dados e tente novamente." });
      if (error instanceof HttpError && error.details && typeof error.details === "object") {
        for (const [key, value] of Object.entries(error.details)) {
          const message = typeof value === "string" ? value : Array.isArray(value) ? value.filter((item) => typeof item === "string").join(" ") : "";
          if (!message) continue;
          if (Object.hasOwn(createDashboardUserSchema.shape, key)) {
            setError(key as keyof CreateDashboardUserValues, { message }, { shouldFocus: true });
          } else if (key === "detail" || key === "non_field_errors") {
            setError("root", { message });
          }
        }
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-user-title"
      aria-describedby="create-user-description"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => { event.preventDefault(); if (!submittingRef.current) onClose(); }}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 id="create-user-title" className="text-xl font-semibold">Novo usuário</h2>
          <p id="create-user-description" className="mt-1 text-sm text-muted-foreground">Preencha os dados e selecione o perfil de acesso.</p>
        </div>
        <Button type="button" variant="ghost" className="h-10 w-10 shrink-0 p-0" disabled={isSubmitting} onClick={onClose} aria-label="Fechar modal">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`create-user-${field.name}`}>{field.label}</Label>
                <Input
                  id={`create-user-${field.name}`}
                  type={"type" in field ? field.type : "text"}
                  autoComplete={field.autoComplete}
                  required={field.name !== "phone"}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={errors[field.name] ? `create-user-${field.name}-error` : undefined}
                  {...register(field.name)}
                />
                {errors[field.name] && <p id={`create-user-${field.name}-error`} className="text-sm text-destructive">{errors[field.name]?.message}</p>}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-role">Perfil de acesso</Label>
            <select id="create-user-role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "create-user-role-error" : undefined} {...register("role")}>
              <option value="student">Estudante</option>
              <option value="teacher">Professor</option>
              <option value="administrative">Administrativo</option>
              <option value="manager">Gerente</option>
            </select>
            {errors.role && <p id="create-user-role-error" className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isSubmitting ? "Criando..." : "Criar usuário"}</Button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
