export type AssistantConversation = {
  id: number;
  title: string;
  is_archived: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type AssistantConversationsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AssistantConversation[];
};

export type AssistantMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  metadata: {
    provider?: string;
    model_id?: string;
    input_tokens?: number;
    output_tokens?: number;
  };
  created_at: string;
};
