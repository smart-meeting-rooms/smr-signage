'use client';
import { useEffect, useState } from 'react';
import { supabase, CompanyValue } from '../../../lib/supabase';

export default function ValuesPage() {
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', body: '', sort_order: 0 });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('company_values').select('*').order('sort_order');
    if (error) setError(error.message);
    else setValues(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      const { error } = await supabase.from('company_values').update({ title: form.title, body: form.body, sort_order: form.sort_order }).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('company_values').insert({ title: form.title, body: form.body, sort_order: form.sort_order });
      if (error) { setError(error.message); return; }
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ title: '', body: '', sort_order: 0 });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this value?')) return;
    const { error } = await supabase.from('company_values').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchData();
  }

  function startEdit(v: CompanyValue) {
    setEditingId(v.id);
    setForm({ title: v.title, body: v.body, sort_order: v.sort_order });
    setShowAdd(false);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm({ title: '', body: '', sort_order: values.length + 1 });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">&#8592; Admin</a>
            <h1 className="text-2xl font-bold text-white mt-1">&#128161; Company Values</h1>
            <p className="text-[#64748b] text-sm mt-1">Values displayed on signage screens</p>
          </div>
          <button onClick={startAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add Value</button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        {(showAdd || editingId) && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Value' : 'Add Value'}</h2>
            <div className="space-y-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-[#64748b] mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. Put people first" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Body</label>
                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white resize-none" placeholder="Description of this value..." />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => { setEditingId(null); setShowAdd(false); }} className="px-4 py-2 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-[#64748b]">Loading...</p>
        ) : values.length === 0 ? (
          <p className="text-[#64748b]">No values yet. Add your first value above.</p>
        ) : (
          <div className="space-y-3">
            {values.map(v => (
              <div key={v.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">#{v.sort_order} {v.title}</p>
                  {v.body && <p className="text-sm text-[#64748b] mt-1">{v.body}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(v)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-blue-900/50 text-white rounded-lg text-sm">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-red-900/50 text-red-400 rounded-lg text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
