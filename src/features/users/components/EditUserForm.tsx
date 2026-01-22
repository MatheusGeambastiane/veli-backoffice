"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormValues } from "@/features/users/schemas/userSchema";
import { useUpdateUser } from "@/features/users/queries/usersQueries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type EditUserFormProps = {
  userId: string;
  defaultValues: UserFormValues;
};

export function EditUserForm({ userId, defaultValues }: EditUserFormProps) {
  const router = useRouter();
  const updateUser = useUpdateUser(userId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (values: UserFormValues) => {
    await updateUser.mutateAsync(values);
    router.push(`/users/${userId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" placeholder="Maria Silva" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="maria@veli.com" {...register("email")} />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Funcao</Label>
          <select
            id="role"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...register("role")}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...register("status")}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Atualizar usuario"}
      </Button>
    </form>
  );
}
