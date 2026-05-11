import { CampaignDetailsPage } from "@/features/campaigns/pages/CampaignDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CampaignDetailsPage campaignId={id} />;
}
