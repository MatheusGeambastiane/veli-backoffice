import { httpClient } from "@/shared/lib/http/http";
import type {
  AssistantConversation,
  AssistantConversationsResponse,
  AssistantMessage,
} from "@/features/assistant/types/assistant";

const basePath = "/dashboard/assistant/conversations";

export const assistantApi = {
  conversations: () =>
    httpClient.get<AssistantConversationsResponse>(`${basePath}/?page_size=20`),
  createConversation: () =>
    httpClient.post<AssistantConversation>(`${basePath}/`, {}),
  messages: (conversationId: number) =>
    httpClient.get<AssistantMessage[]>(`${basePath}/${conversationId}/messages/`),
  sendMessage: (conversationId: number, content: string) =>
    httpClient.post<AssistantMessage>(`${basePath}/${conversationId}/messages/`, { content }),
};
