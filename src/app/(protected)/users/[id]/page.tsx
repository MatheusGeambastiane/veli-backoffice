import { UserDetailsPage } from "@/features/users/pages/UserDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <UserDetailsPage userId={id} />;
}
