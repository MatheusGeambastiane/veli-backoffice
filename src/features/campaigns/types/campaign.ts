export type CampaignListItem = {
  id: number;
  name: string;
  start_date: string;
  finish_date: string;
  salles_target: string;
  total_billed_amount: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
};

export type CampaignListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CampaignListItem[];
};

export type CampaignOffer = {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
};

export type CampaignDetail = CampaignListItem & {
  offers: CampaignOffer[];
  total_orders_created: number;
  total_pending_orders: number;
  total_paid_orders_amount: number;
};

export type CreateCampaignPayload = {
  name: string;
  start_date: string;
  finish_date: string;
  salles_target: string;
};

export type CampaignListParams = {
  name?: string;
  page?: number;
  pageSize?: number;
};
