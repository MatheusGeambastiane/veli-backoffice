"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/shared/components/layout/Topbar";

type ProtectedContentProps = {
  children: React.ReactNode;
  userName?: string | null;
};

export function ProtectedContent({ children, userName }: ProtectedContentProps) {
  const pathname = usePathname();
  const isAssistant = pathname.startsWith("/assistant");

  if (isAssistant) {
    return <main className="min-w-0 flex-1 overflow-hidden">{children}</main>;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Topbar userName={userName} />
      <main className="flex-1 overflow-x-hidden px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-2 lg:pb-8">
        <div className="mx-auto w-full max-w-none lg:w-[90vw]">{children}</div>
      </main>
    </div>
  );
}
