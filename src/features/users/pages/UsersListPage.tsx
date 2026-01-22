"use client";

import Link from "next/link";
import { useUsersList } from "@/features/users/queries/usersQueries";
import { UsersTable } from "@/features/users/components/UsersTable";
import { buttonVariants } from "@/shared/components/ui/button";

export function UsersListPage() {
  const { data, isLoading, isError } = useUsersList();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuarios...</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Erro ao carregar usuarios.</p>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">Nenhum usuario encontrado.</p>
          </div>
          <Link href="/users/new" className={buttonVariants({})}>
            Novo usuario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gerencie os acessos do time.</p>
        </div>
        <Link href="/users/new" className={buttonVariants({})}>
          Novo usuario
        </Link>
      </div>
      <UsersTable users={data} />
    </section>
  );
}
