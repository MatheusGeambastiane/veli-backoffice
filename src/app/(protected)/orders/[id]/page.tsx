import { OrderDetailsPage } from "@/features/orders/pages/OrderDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} />;
}
