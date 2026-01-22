import { EditUserPage } from "@/features/users/pages/EditUserPage";

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  return <EditUserPage userId={params.id} />;
}
