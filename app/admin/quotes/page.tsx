'use client';
import { useEffect, useState } from 'react';
import { supabase, OrgQuote } from '../../../lib/supabase';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<OrgQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ text: '', author: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('org_quotes').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setQuotes(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.text.trim()) return;
    if (editingId) {
      const { error } = await supabase.from('org_quotes').update({ text: form.text, author: form.author || null }).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('org_quotes').insert({ text: form.text, author: form.author || null });
      if (error) { setError(error.message); return; }
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ text: '', author: '' });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quote?')) return;
    const { error } = await supabase.from('org_quotes').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchData();
  }

  function startEdit(q: OrgQuote) {
    setEditingId(q.id);
    setForm({ text: q.text, author: q.author || '' });
    setShowAdd(false);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm({ text: '', author: '' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">← Admin</a>
            <h1 className="text-2xl font-bold text-white mt-1">💬 Quotes</h1>
          </div>
          <button onClick={startAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add Quote</button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        {(showAdd || editingId) && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Quote' : 'Add Quote'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Quote Text *</label>
                <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={3} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white resize-none" placeholder="e.g. The best way to predict the future is to create it." />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Author</label>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. Peter Drucker" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => { setEditingId(null); setShowAdd(false); }} className="px-4 py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-[#64748b] text-center py-12">Loading...</div>
        ) : quotes.length === 0 ? (
          <div className="text-[#64748b] text-center py-12">No quotes yet. Add your first quote above.</div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => (
              <div key={q.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white italic">“{q.text}”</p>
                    {q.author && <p className="text-[#64748b] text-sm mt-1">— {q.author}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(q)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-blue-900/50 text-white rounded-lg text-sm">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-red-900/50 text-red-400 rounded-lg text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
