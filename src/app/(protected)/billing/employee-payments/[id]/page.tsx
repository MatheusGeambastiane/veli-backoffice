import { EmployeePaymentDetailsPage } from "@/features/billing/pages/EmployeePaymentDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <EmployeePaymentDetailsPage paymentId={id} />;
}
