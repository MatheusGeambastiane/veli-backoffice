import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { offersApi } from "@/features/offers/api/offersApi";
import type { CreateOfferPayload, OfferListParams } from "@/features/offers/types/offer";

export const offersKeys = {
  all: ["offers"] as const,
  list: (params: OfferListParams) => [...offersKeys.all, "list", params] as const,
  details: () => [...offersKeys.all, "detail"] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
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

export function useOfferDetails(id: string) {
  const { status } = useSession();

  return useQuery({
    queryKey: offersKeys.detail(id),
    queryFn: () => offersApi.details(id),
    enabled: status === "authenticated" && Boolean(id),
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
