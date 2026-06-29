'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import {
  CrmDeal,
  CrmStage,
  CrmContact,
  CrmProfile,
  CrmActivity,
  CrmEmail,
} from '../../../../lib/supabase';

const supabase = createClient();

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `${currency} ${value}`;
  }
}

function fmtDate(s: string | null) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<CrmDeal | null>(null);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [allContacts, setAllContacts] = useState<CrmContact[]>([]);
  const [dealContacts, setDealContacts] = useState<
    { contact: CrmContact; role: string | null }[]
  >([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [emails, setEmails] = useState<CrmEmail[]>([]);
  const [me, setMe] = useState<CrmProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [newActivity, setNewActivity] = useState({
    title: '',
    type: 'task',
    assigned_to: '',
    due_date: '',
  });
  const [addContactId, setAddContactId] = useState('');

  useEffect(() => {
    if (dealId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function fetchAll() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const [d, st, pr, ct, dc, ac, em] = await Promise.all([
      supabase.from('crm_deals').select('*').eq('id', dealId).single(),
      supabase.from('crm_stages').select('*').order('sort_order'),
      supabase.from('crm_profiles').select('*').order('full_name'),
      supabase.from('crm_contacts').select('*').order('name'),
      supabase
        .from('crm_deal_contacts')
        .select('role, crm_contacts(*)')
        .eq('deal_id', dealId),
      supabase
        .from('crm_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('completed')
        .order('due_date', { nullsFirst: false }),
      supabase
        .from('crm_emails')
        .select('*')
        .eq('deal_id', dealId)
        .order('received_at', { ascending: false }),
    ]);

    if (d.error) setError(d.error.message);
    setDeal(d.data || null);
    setStages(st.data || []);
    setProfiles(pr.data || []);
    setAllContacts(ct.data || []);
    setDealContacts(
      (dc.data || []).map((row: { role: string | null; crm_contacts: CrmContact | CrmContact[] }) => ({
        role: row.role,
        contact: Array.isArray(row.crm_contacts)
          ? row.crm_contacts[0]
          : row.crm_contacts,
      }))
    );
    setActivities(ac.data || []);
    setEmails(em.data || []);
    setMe((pr.data || []).find((p) => p.id === uid) || null);
    setLoading(false);
  }

  const profileName = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ||
    profiles.find((p) => p.id === id)?.email ||
    'Unassigned';

  async function updateDeal(patch: Partial<CrmDeal>) {
    if (!deal) return;
    const { error } = await supabase
      .from('crm_deals')
      .update(patch)
      .eq('id', deal.id);
    if (error) setError(error.message);
    else fetchAll();
  }

  async function changeStage(stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    const status = stage?.is_won ? 'won' : stage?.is_lost ? 'lost' : 'open';
    await updateDeal({
      stage_id: stageId,
      status,
      closed_at: status === 'open' ? null : new Date().toISOString(),
    });
  }

  async function addContact() {
    if (!addContactId || !deal) return;
    const { error } = await supabase
      .from('crm_deal_contacts')
      .insert({ deal_id: deal.id, contact_id: addContactId });
    if (error) setError(error.message);
    else {
      setAddContactId('');
      fetchAll();
    }
  }

  async function removeContact(contactId: string) {
    if (!deal) return;
    await supabase
      .from('crm_deal_contacts')
      .delete()
      .eq('deal_id', deal.id)
      .eq('contact_id', contactId);
    fetchAll();
  }

  async function addActivity() {
    if (!newActivity.title.trim() || !deal || !me) return;
    const { error } = await supabase.from('crm_activities').insert({
      organization_id: deal.organization_id,
      deal_id: deal.id,
      type: newActivity.type,
      title: newActivity.title.trim(),
      assigned_to: newActivity.assigned_to || null,
      due_date: newActivity.due_date || null,
      created_by: me.id,
    });
    if (error) setError(error.message);
    else {
      setNewActivity({ title: '', type: 'task', assigned_to: '', due_date: '' });
      fetchAll();
    }
  }

  async function toggleActivity(a: CrmActivity) {
    await supabase
      .from('crm_activities')
      .update({
        completed: !a.completed,
        completed_at: !a.completed ? new Date().toISOString() : null,
      })
      .eq('id', a.id);
    fetchAll();
  }

  async function syncEmails() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/crm/sync-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSyncMsg(`⚠ ${json.error || 'Sync failed'}`);
      } else if (json.message) {
        setSyncMsg(json.message);
      } else {
        setSyncMsg(
          `Synced ${json.synced} new email(s) from ${json.contacts} contact(s).`
        );
        fetchAll();
      }
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#64748b] p-8">Loading…</div>
    );
  }
  if (!deal) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
        <a href="/admin/deals" className="text-[#64748b] hover:text-white text-sm">
          ← Deals
        </a>
        <p className="mt-4">Deal not found.</p>
      </div>
    );
  }

  const linkedContactIds = new Set(dealContacts.map((d) => d.contact?.id));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-5xl mx-auto">
        <a href="/admin/deals" className="text-[#64748b] hover:text-white text-sm">
          ← Deals
        </a>

        {/* Header */}
        <div className="flex items-start justify-between mt-2 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{deal.title}</h1>
            <div className="text-[#94a3b8] mt-1">
              {money(Number(deal.value), deal.currency)} ·{' '}
              <span
                className={
                  deal.status === 'won'
                    ? 'text-green-400'
                    : deal.status === 'lost'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }
              >
                {deal.status.toUpperCase()}
              </span>
            </div>
          </div>
          <select
            value={deal.stage_id || ''}
            onChange={(e) => changeStage(e.target.value)}
            className="bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-sm"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: details + contacts */}
          <div className="space-y-6">
            <section className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Details</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#64748b]">Owner</dt>
                  <dd className="text-white">{profileName(deal.owner_id)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748b]">Expected close</dt>
                  <dd className="text-white">
                    {fmtDate(deal.expected_close_date) || '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748b]">Created</dt>
                  <dd className="text-white">{fmtDate(deal.created_at)}</dd>
                </div>
              </dl>
              {deal.description && (
                <p className="text-sm text-[#94a3b8] mt-3 whitespace-pre-wrap">
                  {deal.description}
                </p>
              )}
            </section>

            <section className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Contacts ({dealContacts.length})
              </h2>
              <div className="space-y-2">
                {dealContacts.map(({ contact, role }) =>
                  contact ? (
                    <div
                      key={contact.id}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div>
                        <div className="text-white">{contact.name}</div>
                        <div className="text-[#64748b] text-xs">
                          {[contact.title, contact.company]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        {contact.email && (
                          <div className="text-[#64748b] text-xs">
                            {contact.email}
                          </div>
                        )}
                        {role && (
                          <div className="text-blue-400 text-xs">{role}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="text-[#64748b] hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null
                )}
                {dealContacts.length === 0 && (
                  <p className="text-[#64748b] text-xs">No contacts yet.</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <select
                  value={addContactId}
                  onChange={(e) => setAddContactId(e.target.value)}
                  className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-white text-sm"
                >
                  <option value="">Add a contact…</option>
                  {allContacts
                    .filter((c) => !linkedContactIds.has(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` — ${c.company}` : ''}
                      </option>
                    ))}
                </select>
                <button
                  onClick={addContact}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              <a
                href="/admin/contacts"
                className="block text-blue-400 hover:text-blue-300 text-xs mt-3"
              >
                + Create a new contact
              </a>
            </section>
          </div>

          {/* Middle column: activities */}
          <div className="space-y-6">
            <section className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Actions & activities
              </h2>
              <div className="space-y-2 mb-4">
                {activities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2 text-sm border-b border-[#1e1e2e] pb-2"
                  >
                    <input
                      type="checkbox"
                      checked={a.completed}
                      onChange={() => toggleActivity(a)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div
                        className={
                          a.completed
                            ? 'line-through text-[#64748b]'
                            : 'text-white'
                        }
                      >
                        <span className="text-[#64748b] text-xs uppercase mr-1">
                          {a.type}
                        </span>
                        {a.title}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {profileName(a.assigned_to)}
                        {a.due_date ? ` · due ${fmtDate(a.due_date)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-[#64748b] text-xs">No actions yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <input
                  value={newActivity.title}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, title: e.target.value })
                  }
                  placeholder="New action…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-white text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newActivity.type}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, type: e.target.value })
                    }
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-white text-sm"
                  >
                    <option value="task">Task</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="email">Email</option>
                    <option value="note">Note</option>
                  </select>
                  <input
                    type="date"
                    value={newActivity.due_date}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, due_date: e.target.value })
                    }
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-white text-sm"
                  />
                </div>
                <select
                  value={newActivity.assigned_to}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      assigned_to: e.target.value,
                    })
                  }
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-white text-sm"
                >
                  <option value="">Assign to…</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addActivity}
                  className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Add action
                </button>
              </div>
            </section>
          </div>

          {/* Right column: emails */}
          <div className="space-y-6">
            <section className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">
                  Emails ({emails.length})
                </h2>
                <button
                  onClick={syncEmails}
                  disabled={syncing}
                  className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-xs disabled:opacity-60"
                >
                  {syncing ? 'Syncing…' : '↻ Sync Outlook'}
                </button>
              </div>
              {syncMsg && (
                <p className="text-xs text-[#94a3b8] mb-3">{syncMsg}</p>
              )}
              <div className="space-y-3">
                {emails.map((e) => (
                  <div
                    key={e.id}
                    className="border-b border-[#1e1e2e] pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          e.direction === 'outbound'
                            ? 'text-green-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {e.direction === 'outbound' ? '↑' : '↓'}
                      </span>
                      <span className="text-white text-sm truncate">
                        {e.subject}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748b] mt-0.5">
                      {e.from_name || e.from_address} · {fmtDate(e.received_at)}
                    </div>
                    {e.body_preview && (
                      <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">
                        {e.body_preview}
                      </p>
                    )}
                    {e.web_link && (
                      <a
                        href={e.web_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Open in Outlook ↗
                      </a>
                    )}
                  </div>
                ))}
                {emails.length === 0 && (
                  <p className="text-[#64748b] text-xs">
                    No emails linked yet. Add contacts with email addresses, then
                    click “Sync Outlook”.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
