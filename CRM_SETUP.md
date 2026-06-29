# Deal Tracker (CRM) — setup

A lightweight Pipedrive-style deal tracker bolted onto the signage app. Track
opportunities through a pipeline, attach contacts, assign actions to your team,
and sync linked Outlook email via Microsoft Graph.

Everything in the code is done. To switch it on you need to do four one-time
things: **run the SQL**, **register an Azure app**, **wire up Supabase auth**,
and **set env vars**.

---

## 1. Run the database schema

In the Supabase dashboard → SQL editor, run [`supabase/crm_schema.sql`](supabase/crm_schema.sql).

It creates the `crm_*` tables (profiles, stages, contacts, deals, deal_contacts,
activities, emails, ms_tokens), enables row-level security, auto-creates a
profile for every user who signs in, and seeds a default pipeline
(Lead In → Contact Made → Proposal Sent → Negotiation → Won / Lost).

> **Organization id:** the script uses a default org
> `00000000-0000-0000-0000-000000000001`. If your signage data already uses a
> specific `organization_id`, change that value in the seed block (and in
> `crm_handle_new_user`) so deals share the same org. With a single org you can
> leave it as-is.

---

## 2. Register an Azure (Entra ID) application

This one app handles **both** login and Outlook access.

1. [Entra admin centre](https://entra.microsoft.com) → **App registrations** → **New registration**.
2. Supported account types: **Accounts in this organizational directory only** (single tenant) is fine for internal use.
3. **Redirect URI** (type *Web*): your Supabase auth callback —
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. After creating it, note the **Application (client) ID** and **Directory (tenant) ID**.
5. **Certificates & secrets** → **New client secret** → copy the secret *value*.
6. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**:
   `openid`, `profile`, `email`, `offline_access`, `User.Read`, `Mail.Read`.
   Then **Grant admin consent**.

---

## 3. Configure Supabase Auth

1. Supabase dashboard → **Authentication → Providers → Azure**: enable it, paste the
   **client ID** and **client secret**, and set **Azure Tenant URL** to
   `https://login.microsoftonline.com/<your-tenant-id>`.
2. **Authentication → URL configuration → Redirect URLs**: add your app's callback,
   e.g. `https://your-app.com/auth/callback` (and `http://localhost:3000/auth/callback`
   for local dev).

The login flow: user clicks *Sign in with Microsoft* → Azure → Supabase
(`/auth/v1/callback`) → our `/auth/callback`, which exchanges the code and stores
the Graph refresh token in `crm_ms_tokens` for background email sync.

---

## 4. Environment variables

Add these to your deployment (Vercel project settings) and `.env.local` for dev:

| Variable | Already set? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ existing | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ existing | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **new** | Server-only. Stores Graph tokens & writes synced emails (bypasses RLS). |
| `MICROSOFT_CLIENT_ID` | **new** | Azure app (client) ID — used to refresh Graph tokens. |
| `MICROSOFT_CLIENT_SECRET` | **new** | Azure client secret. |
| `MICROSOFT_TENANT_ID` | **new** | Azure directory (tenant) ID. |

> Keep `SUPABASE_SERVICE_ROLE_KEY` and `MICROSOFT_CLIENT_SECRET` server-side only —
> they are never exposed to the browser (no `NEXT_PUBLIC_` prefix).

---

## How it works

- **`/admin/deals`** — pipeline board. Create deals, drag through stages (via the
  per-card stage dropdown), see totals per column. Auth-gated by `middleware.ts`.
- **`/admin/deals/[id]`** — deal detail: owner/value/close date, attached contacts,
  assigned actions (tasks/calls/meetings with assignee + due date), and linked emails.
- **`/admin/contacts`** — manage the people. A contact's **email address** is what
  the sync matches against.
- **Email sync** — on a deal, **↻ Sync Outlook** calls `POST /api/crm/sync-emails`.
  It refreshes your Graph token, searches *your* mailbox for messages involving the
  deal's contact emails, dedupes by Graph message id, and links new ones to the deal.

## Adding your team

Anyone who signs in with Microsoft gets a `crm_profiles` row automatically and can
be assigned deals and actions. To make someone an admin, set their `role` to
`'admin'` in the `crm_profiles` table.

## Notes & possible follow-ups

- Sync is **on-demand** (button click), pulling each signed-in user's own mailbox.
  A scheduled background sync (cron) or webhook-driven push could be added later.
- Stages are configurable in the `crm_stages` table; the UI reads them dynamically.
- The board uses a stage dropdown rather than drag-and-drop to avoid adding a DnD
  dependency — easy to upgrade if you want it.
