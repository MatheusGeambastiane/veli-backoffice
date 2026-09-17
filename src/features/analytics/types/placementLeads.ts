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
  contacted_at: string | null;
  observation: string;
  tests_count: number;
  max_questions: number;
};

export type PlacementAnswer = {
  id: number;
  question: string;
  context: string;
  skill: "grammar" | "vocabulary" | "reading";
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
  skill: "grammar" | "vocabulary" | "reading";
  prompt: string;
  context: string;
  explanation: string;
  order: number;
  is_active: boolean;
  options: PlacementOption[];
};

export type DashboardLanguage = { id: number; name: string };
