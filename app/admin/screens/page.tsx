'use client';
import { useEffect, useState } from 'react';
import { supabase, Screen, Profile } from '../../../lib/supabase';

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', location: '', profile_id: '', active: true });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: s, error: se }, { data: p, error: pe }] = await Promise.all([
      supabase.from('screens').select('*').order('name'),
      supabase.from('profiles').select('*').order('name'),
    ]);
    if (se || pe) setError(se?.message || pe?.message || 'Error loading data');
    else {
      setScreens(s || []);
      setProfiles(p || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      const { error } = await supabase.from('screens').update({ name: form.name, location: form.location, profile_id: form.profile_id || null, active: form.active }).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('screens').insert({ name: form.name, location: form.location, profile_id: form.profile_id || null, active: form.active });
      if (error) { setError(error.message); return; }
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', location: '', profile_id: '', active: true });
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
    setForm({ name: screen.name, location: screen.location, profile_id: screen.profile_id || '', active: screen.active });
    setShowAdd(false);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm({ name: '', location: '', profile_id: '', active: true });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">← Admin</a>
            <h1 className="text-2xl font-bold text-white mt-1">🖥️ Screens</h1>
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
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. Reception" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. Ground Floor" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Profile</label>
                <select value={form.profile_id} onChange={e => setForm({ ...form, profile_id: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white">
                  <option value="">-- None --</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm text-[#64748b]">Active</span>
                </label>
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
        ) : screens.length === 0 ? (
          <div className="text-[#64748b] text-center py-12">No screens yet. Add your first screen above.</div>
        ) : (
          <div className="space-y-3">
            {screens.map(screen => (
              <div key={screen.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{screen.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${screen.active ? 'bg-green-900/50 text-green-400' : 'bg-[#1e1e2e] text-[#64748b]'}`}>{screen.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="text-sm text-[#64748b] mt-1">
                    {screen.location && <span>{screen.location}</span>}
                    {screen.profile_id && <span className="ml-3">Profile: {profiles.find(p => p.id === screen.profile_id)?.name || screen.profile_id}</span>}
                  </div>
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
