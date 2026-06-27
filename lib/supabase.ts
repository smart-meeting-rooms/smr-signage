import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type Screen = {
  id: string;
  name: string;
  location: string;
  profile_id: string | null;
  active: boolean;
};

export type Profile = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  surf_lat: number | null;
  surf_lon: number | null;
};

export type OrgValue = {
  id: string;
  org_id: string;
  text: string;
  sort_order: number;
};

export type OrgQuote = {
  id: string;
  org_id: string;
  text: string;
  author: string | null;
};
