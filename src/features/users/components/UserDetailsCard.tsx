import type { User } from "@/features/users/types/user";

type UserDetailsCardProps = {
  user: User;
};

export function UserDetailsCard({ user }: UserDetailsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <div>
        <p className="text-sm text-muted-foreground">Nome</p>
        <p className="text-lg font-semibold">{user.name}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p>{user.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Funcao</p>
          <p className="capitalize">{user.role}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="capitalize">{user.status}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Criado em</p>
        <p>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
      </div>
    </div>
  );
}
