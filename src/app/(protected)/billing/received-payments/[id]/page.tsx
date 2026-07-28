import { ReceivedPaymentDetailsPage } from "@/features/billing/pages/ReceivedPaymentDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ReceivedPaymentDetailsPage paymentId={id} />;
}
