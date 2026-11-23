export type PlacementLeadFilters = {
  language?: string;
  estimated_level?: string;
  has_purchased?: "true" | "false" | "";
  status?: "started" | "completed" | "";
};

export const leadStages = [
  { value: "not_contacted", label: "Não contatado", color: "border-t-slate-400" },
  { value: "discarded", label: "Descartado", color: "border-t-rose-400" },
  { value: "in_contact", label: "Em contato", color: "border-t-blue-500" },
  { value: "hired", label: "Contratado", color: "border-t-emerald-500" },
] as const;
export type LeadStage = typeof leadStages[number]["value"];
export type LeadSummary = { total: number; stages: Record<LeadStage, number>; success_rate: number };

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PlacementLeadSummary = {
  id: number;
  public_id: string;
  name: string;
  phone: string;
  email: string;
  language_name: string;
  status: "started" | "completed" | "converted";
  estimated_level: string;
  answers_count: number;
  correct_count: number;
  started_at: string;
  has_purchased: boolean;
  is_contacted: boolean;
  stage: LeadStage;
  contacted_at: string | null;
  observation: string;
  tests_count: number;
  max_questions: number;
};

export type PlacementAnswer = {
  id: number;
  question: string;
  context: string;
  skill: "grammar" | "vocabulary" | "reading" | "listening";
  question_level: string;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  response_ms: number | null;
  answered_at: string;
};

export type PlacementAttempt = {
  id: number;
  public_id: string;
  language: string;
  level: string;
  status: string;
  questions_answered: number;
  correct_answers: number;
  max_questions: number;
  started_at: string;
  completed_at: string | null;
  answers: PlacementAnswer[];
};

export type PlacementPurchase = {
  id: number;
  offer: string;
  checkout_status: string;
  status: string;
  payment_type: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
};

export type PlacementEnrollment = {
  id: number;
  status: string;
  course: string;
  language: string;
  level: string;
  class_id: number;
  class_start: string;
  class_finish: string;
  order_id: number | null;
};

export type PlacementLeadDetail = PlacementLeadSummary & {
  utm_source: string;
  referrer: string;
  marketing_consent: boolean;
  consent_at: string | null;
  completed_at: string | null;
  converted_at: string | null;
  tests: PlacementAttempt[];
  purchases: PlacementPurchase[];
  enrollments: PlacementEnrollment[];
  matched_user: { id: number; name: string; email: string; phone: string } | null;
};

export type PlacementLeadCommunication = {
  id: number;
  direction: "outbound" | "inbound";
  message_type: "template" | "text" | "interactive";
  status: "pending" | "processing" | "sent" | "received" | "failed";
  recipient_phone: string;
  conversation_id: string;
  template_name: string;
  template_language: string;
  body_text: string;
  interactive_id: string;
  interactive_type: string;
  button_clicked: boolean;
  requested_by_name: string;
  occurred_at: string;
  sent_at: string | null;
  failed_at: string | null;
  last_error: string;
};

export type PlacementLeadCommunicationPayload =
  | {
      message_type: "template";
      template_name: string;
      template_language: string;
      template_params: string[];
    }
  | { message_type: "text"; message: string };

export type PlacementLeadWhatsappTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  preview: string;
  parameter_count: number;
  uses_automatic_parameters: boolean;
};

export type PlacementLeadBulkCampaign = {
  id: number;
  status: "scheduled" | "queued" | "processing" | "completed" | "canceled";
  template_name: string;
  template_language: string;
  template_preview: string;
  scheduled_at: string | null;
  total_count: number;
  sent_count: number;
  failed_count: number;
  canceled_count: number;
  processed_count: number;
  progress_percent: number;
  can_cancel: boolean;
  cancel_requested_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type PlacementLeadBulkCampaignPayload = {
  lead_ids: number[];
  template_name: string;
  template_language: string;
  template_params: string[];
  scheduled_at?: string | null;
};

export type PlacementOption = {
  id?: number;
  label: string;
  text: string;
  is_correct: boolean;
  order: number;
};

export type PlacementQuestion = {
  id: number;
  language: number;
  language_name: string;
  level: string;
  skill: "grammar" | "vocabulary" | "reading" | "listening";
  prompt: string;
  context: string;
  explanation: string;
  audio_url: string;
  audio_source_url: string;
  audio_credit: string;
  audio_license: string;
  audio_transcript: string;
  order: number;
  is_active: boolean;
  options: PlacementOption[];
};

export type DashboardLanguage = { id: number; name: string };
