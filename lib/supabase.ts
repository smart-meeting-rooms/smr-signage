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
