export type AnalyticsSource = "site" | "student";
export type AnalyticsPeriod = "today" | "7d" | "30d";

export type RankedItem = { label: string; total: number };
export type AnalyticsError = {
  id: number;
  event_id: string;
  occurred_at: string;
  path: string;
  endpoint: string;
  http_method: string;
  http_status: number | null;
  message: string;
  stack: string;
  form_inputs: Record<string, unknown>;
  metadata: Record<string, unknown>;
  session_id: string;
  user: string | null;
};

export type AnalyticsResponse = {
  source: AnalyticsSource;
  period: AnalyticsPeriod;
  start_at: string;
  end_at: string;
  big_numbers: {
    total_accesses: number;
    unique_sessions: number;
    unique_users: number;
    offer_clicks: number;
    conversions: number;
    conversion_rate: number;
    average_duration_seconds: number;
    errors: number;
  };
  histogram: Array<{ date: string; accesses: number }>;
  origins: Array<{ origin: string; total: number }>;
  top_pages: RankedItem[];
  top_lessons: RankedItem[];
  top_offers: RankedItem[];
  top_students: Array<{ user_id: number; name: string; total: number }>;
  funnel: Array<{ step: string; label: string; total: number; dropoff: number }>;
  errors: AnalyticsError[];
  placement_test: {
    started: number;
    leads: number;
    completed: number;
    abandoned_after_lead: number;
    converted: number;
    completion_rate: number;
    conversion_rate: number;
    recent_leads: Array<{
      id: string;
      name: string;
      phone: string;
      language: string;
      level: string;
      status: "started" | "completed" | "converted";
      questions_answered: number;
      max_questions: number;
      started_at: string;
      converted_at: string | null;
      has_purchased: boolean;
    }>;
  };
};
