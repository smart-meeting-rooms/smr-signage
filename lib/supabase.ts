import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Screen = {
  id: string;
  name: string;
  slug: string;
  device_key: string;
  timezone: string;
  orientation: string;
  active: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export type WeatherLocation = {
  id: string;
  organization_id: string;
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  surf_lat: number | null;
  surf_lon: number | null;
};

export type CompanyValue = {
  id: string;
  organization_id: string;
  title: string;
  body: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Quote = {
  id: string;
  organization_id: string;
  body: string;
  attribution: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type DisplayProfile = {
  id: string;
  organization_id: string;
  screen_id: string;
  name: string;
  rotation_seconds: number;
  show_weather: boolean;
  show_surf: boolean;
  show_traffic: boolean;
  show_radio: boolean;
  show_quotes: boolean;
  show_values: boolean;
  stream_url: string | null;
  stream_name: string | null;
  theme: string;
  created_at: string;
};

// Legacy aliases for backward compatibility
export type Profile = WeatherLocation;
export type OrgValue = CompanyValue;
export type OrgQuote = Quote;

// ---------------------------------------------------------------------------
// Deal Tracker (CRM) types
// ---------------------------------------------------------------------------
export type CrmProfile = {
  id: string;
  organization_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type CrmStage = {
  id: string;
  organization_id: string;
  name: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
};

export type CrmContact = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
};

export type CrmDeal = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  value: number;
  currency: string;
  stage_id: string | null;
  status: 'open' | 'won' | 'lost';
  owner_id: string | null;
  primary_contact_id: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmActivity = {
  id: string;
  organization_id: string;
  deal_id: string | null;
  type: 'task' | 'call' | 'meeting' | 'email' | 'note';
  title: string;
  notes: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type CrmEmail = {
  id: string;
  organization_id: string;
  deal_id: string;
  graph_message_id: string | null;
  internet_message_id: string | null;
  subject: string | null;
  from_name: string | null;
  from_address: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  direction: 'inbound' | 'outbound';
  body_preview: string | null;
  web_link: string | null;
  sent_at: string | null;
  received_at: string | null;
  synced_by: string | null;
  created_at: string;
};
