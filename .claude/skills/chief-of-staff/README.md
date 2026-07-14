# Chief of Staff

Nic's personal Chief of Staff agent for Smart Meeting Rooms / Smart Workspaces.
It holds the state of the whole business so Nic doesn't have to carry it in his
head — reads meetings, email, the knowledge base and finance, then produces a
short daily brief, keeps a running ledger of every live project, surfaces what's
waiting on Nic, drafts follow-ups, and watches cash.

Built because the SMR knowledge base already references a *"Daily Command Center"*
as an upstream skill that was never built — this is it.

## How to run it

In Claude Code (this repo) or claude.ai with the connectors attached:

- `run my morning brief` — the daily rundown (default mode)
- `what's waiting on me` — the accountability / chase list
- `status on Tower 42` — one-project deep-dive
- `prep me for [meeting or client]` — pre-meeting pack
- `end of day dump` (then talk/paste) — turns a brain-dump into routed actions

Or just: **"chief of staff"**.

The agent's brain and operating rules are in `SKILL.md`. It writes to one file it
owns — `references/project-ledger.md` — which is its memory between runs. Commit
that file when it updates so state persists across sessions/containers.

## Connectors it uses

| Purpose | Connector | Notes |
|---------|-----------|-------|
| Meetings / notes | Granola | primary source of decisions & actions |
| Email / calendar | Microsoft 365 | what's waiting on Nic; today's schedule |
| Business knowledge | SMR Knowledge Base | personas, pricing, playbooks |
| Finance | QuickBooks | cash / AR aging (tokens expire — re-auth in connector settings) |
| Deal tracker | this repo's Supabase CRM | deals, contacts, activities, emails |

## Design principles (from Nic's own words)

- **Short beats complete.** Nic's feedback is that SMR gives clients "too much."
  The brief leads with *one* thing, offers *three* options max, recommends rather
  than surveys.
- **Draft, never send.** Nothing goes out — email, invoice, deal change — without
  Nic's say-so in the moment.
- **Never invent.** Every status traces to a real source; unauthorised/failed
  tools are noted in a line, not guessed around.
- **Route to owners.** Jess owns Tower 42 & 5CP; Jess/Tam own SA. Not everything
  is Nic's to do.
- **Financial visibility first.** Nic's stated #1 blocker is not seeing cash — the
  brief always tries to surface it.

## Roadmap — to make it fully autonomous

1. **CRM write-back.** Wire a Supabase MCP server (or a small internal API on the
   existing Next.js app) so the agent can *create/complete* `crm_activities` and
   move `crm_deals` stages directly, instead of proposing them. The schema is
   already in `supabase/crm_schema.sql`.
2. **Scheduled run.** Fire the morning brief automatically (e.g. 07:30 daily) via
   a Routine / cron so it lands before the day starts.
3. **Finance swap.** When Nic moves QuickBooks → Xero, point the money-watch step
   at Xero. The skill reads "the live system of record" so only the tool changes.
4. **Lifecycle pipeline.** As install/warranty dates get logged in the ledger's
   tracker, auto-surface "room refresh" upsell triggers ~12 months out — the
   recurring, IT-company-style pipeline Nic wants.
5. **Sub-skills.** It already hands off to the KB's `proposal-generator`,
   `meeting-notes-processor`, and `room-calculator` skills; keep those as the
   specialist tools the Chief of Staff calls.

## Note on the knowledge base

The SMR skills live in the separate SMR Knowledge Base (read-only from here). A
mirror of this skill can be dropped into that KB's `04-agent-skills/` folder as
`chief-of-staff-skill.md` so it sits alongside the other agent skills.
