import { CourseDetailsPage } from "@/features/courses/pages/CourseDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CourseDetailsPage courseId={id} />;
}
