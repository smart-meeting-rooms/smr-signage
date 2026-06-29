'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import {
  CrmStage,
  CrmDeal,
  CrmContact,
  CrmProfile,
} from '../../../lib/supabase';

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

export default function DealsBoardPage() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [me, setMe] = useState<CrmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '',
    value: '',
    currency: 'GBP',
    stage_id: '',
    owner_id: '',
    primary_contact_id: '',
    expected_close_date: '',
    description: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const [st, dl, ct, pr] = await Promise.all([
      supabase.from('crm_stages').select('*').order('sort_order'),
      supabase.from('crm_deals').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_contacts').select('*').order('name'),
      supabase.from('crm_profiles').select('*').order('full_name'),
    ]);

    if (st.error) setError(st.error.message);
    setStages(st.data || []);
    setDeals(dl.data || []);
    setContacts(ct.data || []);
    setProfiles(pr.data || []);
    const mine = (pr.data || []).find((p) => p.id === uid) || null;
    setMe(mine);
    setForm((f) => ({
      ...f,
      owner_id: f.owner_id || mine?.id || '',
      stage_id: f.stage_id || st.data?.[0]?.id || '',
    }));
    setLoading(false);
  }

  const dealsByStage = useMemo(() => {
    const map: Record<string, CrmDeal[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of deals) {
      if (d.stage_id && map[d.stage_id]) map[d.stage_id].push(d);
    }
    return map;
  }, [stages, deals]);

  const profileName = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ||
    profiles.find((p) => p.id === id)?.email ||
    '—';
  const contactName = (id: string | null) =>
    contacts.find((c) => c.id === id)?.name || null;

  async function createDeal() {
    if (!form.title.trim() || !me) return;
    const stage = stages.find((s) => s.id === form.stage_id);
    const { error } = await supabase.from('crm_deals').insert({
      organization_id: me.organization_id,
      title: form.title.trim(),
      description: form.description || null,
      value: form.value ? Number(form.value) : 0,
      currency: form.currency || 'GBP',
      stage_id: form.stage_id || null,
      owner_id: form.owner_id || null,
      primary_contact_id: form.primary_contact_id || null,
      expected_close_date: form.expected_close_date || null,
      status: stage?.is_won ? 'won' : stage?.is_lost ? 'lost' : 'open',
    });
    if (error) {
      setError(error.message);
      return;
    }
    setShowAdd(false);
    setForm({
      title: '',
      value: '',
      currency: 'GBP',
      stage_id: stages[0]?.id || '',
      owner_id: me.id,
      primary_contact_id: '',
      expected_close_date: '',
      description: '',
    });
    fetchAll();
  }

  async function moveDeal(deal: CrmDeal, stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    const status = stage?.is_won ? 'won' : stage?.is_lost ? 'lost' : 'open';
    const { error } = await supabase
      .from('crm_deals')
      .update({
        stage_id: stageId,
        status,
        closed_at: status === 'open' ? null : new Date().toISOString(),
      })
      .eq('id', deal.id);
    if (error) setError(error.message);
    else fetchAll();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">
              ← Admin
            </a>
            <h1 className="text-2xl font-bold text-white mt-1">📈 Deal Tracker</h1>
            <p className="text-[#64748b] text-sm mt-1">
              {deals.filter((d) => d.status === 'open').length} open ·{' '}
              {money(
                deals
                  .filter((d) => d.status === 'open')
                  .reduce((s, d) => s + Number(d.value || 0), 0),
                'GBP'
              )}{' '}
              in pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/contacts"
              className="px-4 py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-sm font-medium"
            >
              Contacts
            </a>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              + New Deal
            </button>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-3 py-2 text-[#64748b] hover:text-white text-sm"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {showAdd && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Deal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#64748b] mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Acme Ltd — 4 meeting room screens"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Value</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Currency</label>
                <input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Stage</label>
                <select
                  value={form.stage_id}
                  onChange={(e) => setForm({ ...form, stage_id: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Owner</label>
                <select
                  value={form.owner_id}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">
                  Primary contact
                </label>
                <select
                  value={form.primary_contact_id}
                  onChange={(e) =>
                    setForm({ ...form, primary_contact_id: e.target.value })
                  }
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                >
                  <option value="">None</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">
                  Expected close
                </label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={(e) =>
                    setForm({ ...form, expected_close_date: e.target.value })
                  }
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[#64748b] mb-1">Notes</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={createDeal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-[#64748b]">Loading…</p>
        ) : stages.length === 0 ? (
          <p className="text-[#64748b]">
            No pipeline stages found. Run the CRM schema SQL to seed default
            stages.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const col = dealsByStage[stage.id] || [];
              const total = col.reduce((s, d) => s + Number(d.value || 0), 0);
              return (
                <div key={stage.id} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      {stage.is_won && <span className="text-green-400">✓</span>}
                      {stage.is_lost && <span className="text-red-400">✕</span>}
                      {stage.name}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {col.length} · {money(total, 'GBP')}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {col.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 hover:border-blue-500 transition-colors"
                      >
                        <a
                          href={`/admin/deals/${deal.id}`}
                          className="block font-medium text-white hover:text-blue-400"
                        >
                          {deal.title}
                        </a>
                        <div className="text-sm text-[#94a3b8] mt-1">
                          {money(Number(deal.value), deal.currency)}
                        </div>
                        {contactName(deal.primary_contact_id) && (
                          <div className="text-xs text-[#64748b] mt-1">
                            👤 {contactName(deal.primary_contact_id)}
                          </div>
                        )}
                        <div className="text-xs text-[#64748b] mt-1">
                          {profileName(deal.owner_id)}
                        </div>
                        <select
                          value={deal.stage_id || ''}
                          onChange={(e) => moveDeal(deal, e.target.value)}
                          className="mt-3 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1 text-xs text-[#94a3b8]"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move to: {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {col.length === 0 && (
                      <div className="text-xs text-[#3f3f5a] italic px-1">
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
