"use client";

import { CreateUserForm } from "@/features/users/components/CreateUserForm";

export function CreateUserPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo usuario</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados para criar um novo acesso.
        </p>
      </div>
      <div className="max-w-xl rounded-lg border border-border bg-card p-6">
        <CreateUserForm />
      </div>
    </section>
  );
}
