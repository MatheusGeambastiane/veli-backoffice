import Link from "next/link";
import type { User } from "@/features/users/types/user";

type UsersTableProps = {
  users: User[];
};

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Funcao</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/users/${user.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
