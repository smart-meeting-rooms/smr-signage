'use client';
import { useEffect, useState } from 'react';
import { supabase, Screen } from '../../../lib/supabase';

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', timezone: 'Europe/London', orientation: 'landscape', active: true });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error: se } = await supabase.from('screens').select('*').order('name');
    if (se) setError(se.message);
    else setScreens(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      timezone: form.timezone || 'Europe/London',
      orientation: form.orientation || 'landscape',
      active: form.active,
    };
    if (editingId) {
      const { error } = await supabase.from('screens').update(payload).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('screens').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', slug: '', timezone: 'Europe/London', orientation: 'landscape', active: true });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this screen?')) return;
    const { error } = await supabase.from('screens').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchData();
  }

  function startEdit(screen: Screen) {
    setEditingId(screen.id);
    setForm({ name: screen.name, slug: screen.slug, timezone: screen.timezone, orientation: screen.orientation, active: screen.active });
    setShowAdd(false);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm({ name: '', slug: '', timezone: 'Europe/London', orientation: 'landscape', active: true });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">&#8592; Admin</a>
            <h1 className="text-2xl font-bold text-white mt-1">&#128507; Screens</h1>
            <p className="text-[#64748b] text-sm mt-1">Manage registered signage screens</p>
          </div>
          <button onClick={startAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add Screen</button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        {(showAdd || editingId) && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Screen' : 'Add Screen'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. Reception Screen" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. reception-screen" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Timezone</label>
                <input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="Europe/London" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Orientation</label>
                <select value={form.orientation} onChange={e => setForm({ ...form, orientation: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white">
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="active" className="text-sm text-[#64748b]">Active</label>
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
        ) : screens.length === 0 ? (
          <p className="text-[#64748b]">No screens yet. Add your first screen above.</p>
        ) : (
          <div className="space-y-3">
            {screens.map(screen => (
              <div key={screen.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{screen.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${screen.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'}`}>{screen.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-sm text-[#64748b]">Slug: {screen.slug} &nbsp; {screen.timezone} &nbsp; {screen.orientation}</p>
                  {screen.last_seen_at && <p className="text-xs text-[#64748b] mt-0.5">Last seen: {new Date(screen.last_seen_at).toLocaleString()}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(screen)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-blue-900/50 text-white rounded-lg text-sm">Edit</button>
                  <button onClick={() => handleDelete(screen.id)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-red-900/50 text-red-400 rounded-lg text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
