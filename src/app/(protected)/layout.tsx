import { redirect } from "next/navigation";
import { getServerSession } from "@/shared/auth/getServerSession";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Topbar } from "@/shared/components/layout/Topbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden w-64 border-r border-border lg:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <Topbar userName={session.user?.name} />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
