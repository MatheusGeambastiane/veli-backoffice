import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { assistantApi } from "@/features/assistant/api/assistantApi";

export const assistantKeys = {
  all: ["assistant"] as const,
  conversations: () => [...assistantKeys.all, "conversations"] as const,
  messages: (conversationId: number | null) =>
    [...assistantKeys.all, "messages", conversationId] as const,
};

export function useAssistantConversations(enabled: boolean) {
  const { status } = useSession();
  return useQuery({
    queryKey: assistantKeys.conversations(),
    queryFn: assistantApi.conversations,
    enabled: enabled && status === "authenticated",
  });
}

export function useAssistantMessages(conversationId: number | null, enabled: boolean) {
  const { status } = useSession();
  return useQuery({
    queryKey: assistantKeys.messages(conversationId),
    queryFn: () => assistantApi.messages(conversationId as number),
    enabled: enabled && status === "authenticated" && conversationId !== null,
  });
}

export function useCreateAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assistantApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.conversations() });
    },
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      assistantApi.sendMessage(id, content),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: assistantKeys.messages(variables.id) });
      queryClient.invalidateQueries({ queryKey: assistantKeys.conversations() });
    },
  });
}
