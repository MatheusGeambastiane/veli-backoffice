export function DashboardPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visao geral do backoffice da escola.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Alunos ativos</p>
          <p className="text-2xl font-semibold">128</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Turmas em andamento</p>
          <p className="text-2xl font-semibold">12</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Usuarios</p>
          <p className="text-2xl font-semibold">8</p>
        </div>
      </div>
    </section>
  );
}
