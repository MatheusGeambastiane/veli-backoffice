import { UserDetailsPage } from "@/features/users/pages/UserDetailsPage";

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  return <UserDetailsPage userId={params.id} />;
}
