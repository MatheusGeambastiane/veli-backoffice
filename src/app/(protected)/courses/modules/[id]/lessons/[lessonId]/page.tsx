"use client";

import { use } from "react";
import { LessonDetailsPage } from "@/features/courses/pages/LessonDetailsPage";

type LessonDetailsRouteProps = {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
};

export default function LessonDetailsRoute({ params }: LessonDetailsRouteProps) {
  const resolvedParams = use(params);
  return (
    <LessonDetailsPage
      moduleId={resolvedParams.id}
      lessonId={resolvedParams.lessonId}
    />
  );
}
