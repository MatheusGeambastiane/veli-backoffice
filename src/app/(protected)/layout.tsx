import { redirect } from "next/navigation";
import { getServerSession } from "@/shared/auth/getServerSession";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { ProtectedContent } from "@/shared/components/layout/ProtectedContent";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="sticky top-0 z-20 hidden h-dvh w-20 shrink-0 self-start lg:block">
          <Sidebar />
        </div>
        <ProtectedContent userName={session.user?.name}>{children}</ProtectedContent>
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
    </div>
  );
}
