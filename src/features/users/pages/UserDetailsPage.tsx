"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteUser, useUserById } from "@/features/users/queries/usersQueries";
import { UserDetailsCard } from "@/features/users/components/UserDetailsCard";
import { buttonVariants } from "@/shared/components/ui/button";

type UserDetailsPageProps = {
  userId: string;
};

export function UserDetailsPage({ userId }: UserDetailsPageProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useUserById(userId);
  const deleteUser = useDeleteUser();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuario...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Usuario nao encontrado.</p>;
  }

  const handleDelete = async () => {
    await deleteUser.mutateAsync(userId);
    router.push("/users");
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Detalhes do usuario</h1>
          <p className="text-sm text-muted-foreground">Informacoes completas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/users/${userId}/edit`} className={buttonVariants({ variant: "outline" })}>
            Editar
          </Link>
          <button
            type="button"
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleDelete}
          >
            Excluir
          </button>
        </div>
      </div>
      <UserDetailsCard user={data} />
    </section>
  );
}
