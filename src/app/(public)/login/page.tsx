import { redirect } from "next/navigation";
import { LoginPage } from "@/features/auth/pages/LoginPage";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.email !== undefined || params.password !== undefined) {
    redirect("/login");
  }

  return <LoginPage />;
}
