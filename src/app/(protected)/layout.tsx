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
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <Topbar userName={session.user?.name} />
          <main className="flex-1 overflow-x-hidden px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
    </div>
  );
}
