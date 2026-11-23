import { redirect } from "next/navigation";
import { getServerSession } from "@/shared/auth/getServerSession";
import { PwaSummaryPage } from "@/features/dashboard/pages/PwaSummaryPage";

export default async function SummaryPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login?callbackUrl=/resumo");
  }

  return <PwaSummaryPage />;
}
