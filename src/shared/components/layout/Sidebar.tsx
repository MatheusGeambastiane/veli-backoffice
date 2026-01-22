import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Usuarios" },
  { href: "/students", label: "Alunos" },
  { href: "/classes", label: "Turmas" },
];

export function Sidebar() {
  return (
    <aside className="flex h-full flex-col border-r border-border bg-card px-4 py-6">
      <div className="mb-8 text-lg font-semibold">Veli School</div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
