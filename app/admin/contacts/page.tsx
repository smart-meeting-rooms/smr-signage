'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { CrmContact, CrmProfile } from '../../../lib/supabase';

const supabase = createClient();

const EMPTY = { name: '', email: '', phone: '', company: '', title: '', notes: '' };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [me, setMe] = useState<CrmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const [ct, pr] = await Promise.all([
      supabase.from('crm_contacts').select('*').order('name'),
      supabase.from('crm_profiles').select('*').eq('id', auth.user?.id || '').single(),
    ]);
    if (ct.error) setError(ct.error.message);
    else setContacts(ct.data || []);
    setMe(pr.data || null);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim() || !me) return;
    const payload = {
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      title: form.title || null,
      notes: form.notes || null,
    };
    if (editingId) {
      const { error } = await supabase
        .from('crm_contacts')
        .update(payload)
        .eq('id', editingId);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase
        .from('crm_contacts')
        .insert({ ...payload, organization_id: me.organization_id });
      if (error) return setError(error.message);
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ ...EMPTY });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact? It will be removed from any deals.'))
      return;
    const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchData();
  }

  function startEdit(c: CrmContact) {
    setEditingId(c.id);
    setShowAdd(false);
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      company: c.company || '',
      title: c.title || '',
      notes: c.notes || '',
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a
              href="/admin/deals"
              className="text-[#64748b] hover:text-white text-sm"
            >
              ← Deals
            </a>
            <h1 className="text-2xl font-bold text-white mt-1">👥 Contacts</h1>
            <p className="text-[#64748b] text-sm mt-1">
              People who belong to your deals
            </p>
          </div>
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
              setForm({ ...EMPTY });
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            + Add Contact
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {(showAdd || editingId) && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                  placeholder="used to match Outlook emails"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">
                  Job title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[#64748b] mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowAdd(false);
                }}
                className="px-4 py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-[#64748b]">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="text-[#64748b]">No contacts yet. Add your first above.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-sm text-[#64748b]">
                    {[c.title, c.company].filter(Boolean).join(' · ')}
                  </div>
                  <div className="text-sm text-[#64748b]">
                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-blue-900/50 text-white rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-red-900/50 text-red-400 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
