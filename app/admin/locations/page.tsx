'use client';
import { useEffect, useState } from 'react';
import { supabase, WeatherLocation } from '../../../lib/supabase';

export default function LocationsPage() {
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', lat: '', lon: '', timezone: '', surf_lat: '', surf_lon: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase.from('weather_locations').select('*').order('name');
    if (error) setError(error.message);
    else setLocations(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      lat: parseFloat(form.lat) || 0,
      lon: parseFloat(form.lon) || 0,
      timezone: form.timezone || 'Europe/London',
      surf_lat: form.surf_lat ? parseFloat(form.surf_lat) : null,
      surf_lon: form.surf_lon ? parseFloat(form.surf_lon) : null,
    };
    if (editingId) {
      const { error } = await supabase.from('weather_locations').update(payload).eq('id', editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('weather_locations').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', lat: '', lon: '', timezone: '', surf_lat: '', surf_lon: '' });
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location?')) return;
    const { error } = await supabase.from('weather_locations').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchData();
  }

  function startEdit(loc: WeatherLocation) {
    setEditingId(loc.id);
    setForm({ name: loc.name, lat: String(loc.lat), lon: String(loc.lon), timezone: loc.timezone, surf_lat: loc.surf_lat != null ? String(loc.surf_lat) : '', surf_lon: loc.surf_lon != null ? String(loc.surf_lon) : '' });
    setShowAdd(false);
  }

  function startAdd() {
    setShowAdd(true);
    setEditingId(null);
    setForm({ name: '', lat: '', lon: '', timezone: 'Europe/London', surf_lat: '', surf_lon: '' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-8">
      <div className="max-w-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-[#64748b] hover:text-white text-sm">&#8592; Admin</a>
            <h1 className="text-2xl font-bold text-white mt-1">&#128205; Locations</h1>
            <p className="text-[#64748b] text-sm mt-1">Weather locations for screens</p>
          </div>
          <button onClick={startAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add Location</button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        {(showAdd || editingId) && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Location' : 'Add Location'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="e.g. London Office" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Latitude</label>
                <input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="51.5074" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Longitude</label>
                <input value={form.lon} onChange={e => setForm({ ...form, lon: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="-0.1278" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Timezone</label>
                <input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="Europe/London" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Surf Lat (optional)</label>
                <input value={form.surf_lat} onChange={e => setForm({ ...form, surf_lat: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="51.45" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Surf Lon (optional)</label>
                <input value={form.surf_lon} onChange={e => setForm({ ...form, surf_lon: e.target.value })} className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white" placeholder="-3.5" />
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
        ) : locations.length === 0 ? (
          <p className="text-[#64748b]">No locations yet. Add your first location above.</p>
        ) : (
          <div className="space-y-3">
            {locations.map(loc => (
              <div key={loc.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{loc.name}</p>
                  <p className="text-sm text-[#64748b]">Lat: {loc.lat}, Lon: {loc.lon} &nbsp; {loc.timezone}{loc.surf_lat && <span> &nbsp; Surf: {loc.surf_lat},{loc.surf_lon}</span>}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(loc)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-blue-900/50 text-white rounded-lg text-sm">Edit</button>
                  <button onClick={() => handleDelete(loc.id)} className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-red-900/50 text-red-400 rounded-lg text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
