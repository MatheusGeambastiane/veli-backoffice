"use client";

import { useUserById } from "@/features/users/queries/usersQueries";
import { EditUserForm } from "@/features/users/components/EditUserForm";

type EditUserPageProps = {
  userId: string;
};

export function EditUserPage({ userId }: EditUserPageProps) {
  const { data, isLoading, isError } = useUserById(userId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuario...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Usuario nao encontrado.</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar usuario</h1>
        <p className="text-sm text-muted-foreground">Atualize os dados do usuario.</p>
      </div>
      <div className="max-w-xl rounded-lg border border-border bg-card p-6">
        <EditUserForm
          userId={userId}
          defaultValues={{
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status,
          }}
        />
      </div>
    </section>
  );
}
