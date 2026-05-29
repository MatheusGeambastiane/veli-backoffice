import { OfferDetailsPage } from "@/features/offers/pages/OfferDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OfferDetailsPage offerId={id} />;
}
