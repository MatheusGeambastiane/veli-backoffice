import { BillDetailsPage } from "@/features/billing/pages/BillDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BillDetailsPage billId={id} />;
}
