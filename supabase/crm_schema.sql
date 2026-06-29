-- ============================================================================
-- SMR Deal Tracker (lightweight CRM) — Supabase schema
-- ============================================================================
-- Run this once in the Supabase SQL editor (or via the CLI) to provision the
-- deal-tracking module. It is namespaced with a `crm_` prefix so it lives
-- cleanly alongside the existing signage tables.
--
-- Auth: relies on Supabase Auth (Azure / Microsoft provider). Every signed-in
-- user gets a row in crm_profiles. Row-Level Security scopes all data to the
-- user's organization.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Profiles: one row per authenticated user, linked to auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.crm_profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null,
  full_name       text,
  email           text,
  avatar_url      text,
  role            text not null default 'member', -- 'admin' | 'member'
  created_at      timestamptz not null default now()
);

-- Helper: organization_id of the currently authenticated user.
-- Used by every RLS policy below. SECURITY DEFINER so it can read the profile
-- row regardless of the caller's own policies (avoids recursive RLS).
create or replace function public.crm_current_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.crm_profiles where id = auth.uid();
$$;

-- Auto-provision a profile when a new auth user is created.
-- New users inherit the organization of the first existing profile (single-org
-- setup); the very first user falls back to a fixed default org you can change.
create or replace function public.crm_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org uuid;
begin
  select organization_id into default_org from public.crm_profiles limit 1;
  if default_org is null then
    default_org := '00000000-0000-0000-0000-000000000001';
  end if;

  insert into public.crm_profiles (id, organization_id, full_name, email, avatar_url)
  values (
    new.id,
    default_org,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_crm on auth.users;
create trigger on_auth_user_created_crm
  after insert on auth.users
  for each row execute function public.crm_handle_new_user();

-- ----------------------------------------------------------------------------
-- Pipeline stages (configurable per organization)
-- ----------------------------------------------------------------------------
create table if not exists public.crm_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name            text not null,
  sort_order      int  not null default 0,
  is_won          boolean not null default false,
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Contacts (people who belong to deals)
-- ----------------------------------------------------------------------------
create table if not exists public.crm_contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name            text not null,
  email           text,
  phone           text,
  company         text,
  title           text,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists crm_contacts_email_idx on public.crm_contacts (lower(email));

-- ----------------------------------------------------------------------------
-- Deals / opportunities
-- ----------------------------------------------------------------------------
create table if not exists public.crm_deals (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null,
  title              text not null,
  description        text,
  value              numeric(14,2) not null default 0,
  currency           text not null default 'GBP',
  stage_id           uuid references public.crm_stages (id) on delete set null,
  status             text not null default 'open', -- 'open' | 'won' | 'lost'
  owner_id           uuid references public.crm_profiles (id) on delete set null,
  primary_contact_id uuid references public.crm_contacts (id) on delete set null,
  expected_close_date date,
  closed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists crm_deals_stage_idx on public.crm_deals (stage_id);
create index if not exists crm_deals_owner_idx on public.crm_deals (owner_id);

-- keep updated_at fresh
create or replace function public.crm_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists crm_deals_touch on public.crm_deals;
create trigger crm_deals_touch before update on public.crm_deals
  for each row execute function public.crm_touch_updated_at();

-- ----------------------------------------------------------------------------
-- Deal <-> Contact (many-to-many, with a role on the deal)
-- ----------------------------------------------------------------------------
create table if not exists public.crm_deal_contacts (
  deal_id    uuid not null references public.crm_deals (id) on delete cascade,
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  role       text, -- e.g. 'Decision maker', 'Champion', 'Procurement'
  created_at timestamptz not null default now(),
  primary key (deal_id, contact_id)
);

-- ----------------------------------------------------------------------------
-- Activities / assigned actions
-- ----------------------------------------------------------------------------
create table if not exists public.crm_activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  deal_id         uuid references public.crm_deals (id) on delete cascade,
  type            text not null default 'task', -- 'task' | 'call' | 'meeting' | 'email' | 'note'
  title           text not null,
  notes           text,
  assigned_to     uuid references public.crm_profiles (id) on delete set null,
  due_date        timestamptz,
  completed       boolean not null default false,
  completed_at    timestamptz,
  created_by      uuid references public.crm_profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists crm_activities_deal_idx on public.crm_activities (deal_id);
create index if not exists crm_activities_assignee_idx on public.crm_activities (assigned_to);

-- ----------------------------------------------------------------------------
-- Emails synced from Microsoft Graph (Outlook) and linked to deals
-- ----------------------------------------------------------------------------
create table if not exists public.crm_emails (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null,
  deal_id           uuid not null references public.crm_deals (id) on delete cascade,
  graph_message_id  text,            -- Microsoft Graph message id (for dedup)
  internet_message_id text,          -- RFC822 Message-Id
  subject           text,
  from_name         text,
  from_address      text,
  to_addresses      text[] not null default '{}',
  cc_addresses      text[] not null default '{}',
  direction         text not null default 'inbound', -- 'inbound' | 'outbound'
  body_preview      text,
  web_link          text,
  sent_at           timestamptz,
  received_at       timestamptz,
  synced_by         uuid references public.crm_profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);
-- one copy of a given Graph message per deal
create unique index if not exists crm_emails_dedup_idx
  on public.crm_emails (deal_id, graph_message_id)
  where graph_message_id is not null;
create index if not exists crm_emails_deal_idx on public.crm_emails (deal_id);

-- ----------------------------------------------------------------------------
-- Microsoft Graph OAuth tokens (per user) — service-role access only
-- ----------------------------------------------------------------------------
create table if not exists public.crm_ms_tokens (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  refresh_token  text,
  access_token   text,
  expires_at     timestamptz,
  scope          text,
  updated_at     timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.crm_profiles      enable row level security;
alter table public.crm_stages        enable row level security;
alter table public.crm_contacts      enable row level security;
alter table public.crm_deals         enable row level security;
alter table public.crm_deal_contacts enable row level security;
alter table public.crm_activities    enable row level security;
alter table public.crm_emails        enable row level security;
alter table public.crm_ms_tokens     enable row level security;

-- Profiles: a user can read profiles in their org, and update their own.
drop policy if exists crm_profiles_select on public.crm_profiles;
create policy crm_profiles_select on public.crm_profiles
  for select using (organization_id = public.crm_current_org());

drop policy if exists crm_profiles_update_self on public.crm_profiles;
create policy crm_profiles_update_self on public.crm_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Generic org-scoped policy applied to the data tables.
-- (select/insert/update/delete all gated on matching organization_id)
do $$
declare t text;
begin
  foreach t in array array['crm_stages','crm_contacts','crm_deals','crm_activities','crm_emails']
  loop
    execute format('drop policy if exists %1$s_org_all on public.%1$s', t);
    execute format($f$
      create policy %1$s_org_all on public.%1$s
        for all
        using (organization_id = public.crm_current_org())
        with check (organization_id = public.crm_current_org())
    $f$, t);
  end loop;
end $$;

-- Deal-contacts join: gate on the parent deal's org.
drop policy if exists crm_deal_contacts_org_all on public.crm_deal_contacts;
create policy crm_deal_contacts_org_all on public.crm_deal_contacts
  for all
  using (exists (
    select 1 from public.crm_deals d
    where d.id = deal_id and d.organization_id = public.crm_current_org()))
  with check (exists (
    select 1 from public.crm_deals d
    where d.id = deal_id and d.organization_id = public.crm_current_org()));

-- MS tokens: no client access at all. Only the service role (used by the
-- server-side sync route) bypasses RLS, so we deliberately add no policies.

-- ============================================================================
-- Seed default pipeline stages for the default organization.
-- Adjust the organization_id to match your org if you already have one.
-- ============================================================================
insert into public.crm_stages (organization_id, name, sort_order, is_won, is_lost)
select '00000000-0000-0000-0000-000000000001', name, ord, won, lost
from (values
  ('Lead In',        0, false, false),
  ('Contact Made',   1, false, false),
  ('Proposal Sent',  2, false, false),
  ('Negotiation',    3, false, false),
  ('Won',            4, true,  false),
  ('Lost',           5, false, true)
) as s(name, ord, won, lost)
where not exists (
  select 1 from public.crm_stages
  where organization_id = '00000000-0000-0000-0000-000000000001'
);
