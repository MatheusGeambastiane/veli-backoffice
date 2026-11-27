import { notFound } from "next/navigation";
import { CouponsPage } from "@/features/coupons/pages/CouponsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const couponId = Number(id);
  if (!Number.isSafeInteger(couponId) || couponId < 1) notFound();
  return <CouponsPage couponId={couponId} />;
}
