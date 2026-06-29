import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceClient } from '../../../../lib/supabase/server';
import {
  getValidAccessToken,
  searchMessagesByContact,
  type GraphMessage,
  type MsTokenRow,
} from '../../../../lib/graph';

// POST /api/crm/sync-emails  { dealId: string }
// Pulls Outlook messages involving the deal's contacts and links new ones.
export async function POST(request: NextRequest) {
  const { dealId } = await request.json().catch(() => ({ dealId: null }));
  if (!dealId) {
    return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
  }

  // 1. Identify the caller and confirm they can see the deal (RLS-scoped).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: deal, error: dealErr } = await supabase
    .from('crm_deals')
    .select('id, organization_id')
    .eq('id', dealId)
    .single();
  if (dealErr || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  // 2. Collect contact email addresses attached to this deal.
  const { data: links } = await supabase
    .from('crm_deal_contacts')
    .select('crm_contacts(email)')
    .eq('deal_id', dealId);
  const emails = Array.from(
    new Set(
      (links ?? [])
        .map((l: { crm_contacts?: { email?: string | null } | { email?: string | null }[] }) => {
          const c = Array.isArray(l.crm_contacts) ? l.crm_contacts[0] : l.crm_contacts;
          return c?.email?.toLowerCase().trim();
        })
        .filter((e): e is string => !!e)
    )
  );

  if (emails.length === 0) {
    return NextResponse.json({
      synced: 0,
      message: 'No contacts with email addresses on this deal.',
    });
  }

  // 3. Refresh the Graph token (service role: crm_ms_tokens has no client RLS).
  const service = createServiceClient();
  const { data: tokenRow } = await service
    .from('crm_ms_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json(
      { error: 'No Microsoft mailbox connected. Sign out and sign in again.' },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(tokenRow as MsTokenRow, async (next) => {
      await service
        .from('crm_ms_tokens')
        .update({ ...next, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Token refresh failed' },
      { status: 502 }
    );
  }

  // 4. Search the mailbox for each contact and collect unique messages.
  const userEmail = (user.email || '').toLowerCase();
  const byId = new Map<string, GraphMessage>();
  try {
    for (const email of emails) {
      const msgs = await searchMessagesByContact(accessToken, email);
      for (const m of msgs) if (m.id) byId.set(m.id, m);
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Graph search failed' },
      { status: 502 }
    );
  }

  // 5. Skip messages already linked to this deal, then insert the rest.
  const { data: existing } = await service
    .from('crm_emails')
    .select('graph_message_id')
    .eq('deal_id', dealId);
  const known = new Set((existing ?? []).map((r: { graph_message_id: string }) => r.graph_message_id));

  const rows = [...byId.values()]
    .filter((m) => !known.has(m.id))
    .map((m) => {
      const fromAddr = m.from?.emailAddress?.address?.toLowerCase() || '';
      return {
        organization_id: deal.organization_id,
        deal_id: dealId,
        graph_message_id: m.id,
        internet_message_id: m.internetMessageId ?? null,
        subject: m.subject ?? '(no subject)',
        from_name: m.from?.emailAddress?.name ?? null,
        from_address: m.from?.emailAddress?.address ?? null,
        to_addresses: (m.toRecipients ?? [])
          .map((r) => r.emailAddress?.address)
          .filter((a): a is string => !!a),
        cc_addresses: (m.ccRecipients ?? [])
          .map((r) => r.emailAddress?.address)
          .filter((a): a is string => !!a),
        direction: fromAddr && fromAddr === userEmail ? 'outbound' : 'inbound',
        body_preview: m.bodyPreview ?? null,
        web_link: m.webLink ?? null,
        sent_at: m.sentDateTime ?? null,
        received_at: m.receivedDateTime ?? null,
        synced_by: user.id,
      };
    });

  let synced = 0;
  if (rows.length > 0) {
    const { error: insErr, count } = await service
      .from('crm_emails')
      .insert(rows, { count: 'exact' });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    synced = count ?? rows.length;
  }

  return NextResponse.json({
    synced,
    scanned: byId.size,
    contacts: emails.length,
  });
}
