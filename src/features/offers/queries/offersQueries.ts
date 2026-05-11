import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { offersApi } from "@/features/offers/api/offersApi";
import type { CreateOfferPayload, OfferListParams } from "@/features/offers/types/offer";

export const offersKeys = {
  all: ["offers"] as const,
  list: (params: OfferListParams) => [...offersKeys.all, "list", params] as const,
  coursesSimple: () => [...offersKeys.all, "courses-simple"] as const,
  studentClassesSimple: () => [...offersKeys.all, "student-classes-simple"] as const,
};

export function useOffersList(params: OfferListParams) {
  const { status } = useSession();

  return useQuery({
    queryKey: offersKeys.list(params),
    queryFn: () => offersApi.list(params),
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useOfferCoursesSimple() {
  const { status } = useSession();

  return useQuery({
    queryKey: offersKeys.coursesSimple(),
    queryFn: offersApi.coursesSimple,
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useOfferStudentClassesSimple() {
  const { status } = useSession();

  return useQuery({
    queryKey: offersKeys.studentClassesSimple(),
    queryFn: offersApi.studentClassesSimple,
    enabled: status === "authenticated",
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => offersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: offersKeys.all,
      });
    },
  });
}
