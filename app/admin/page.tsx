export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] p-10">
      <div className="max-w-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">SMR Signage Admin</h1>
          <p className="text-[#64748b] mt-2">Manage screens, content and settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/admin/screens" className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 hover:border-blue-500 transition-colors block">
            <h2 className="text-lg font-semibold text-white mb-1">🖥️ Screens</h2>
            <p className="text-[#64748b] text-sm mb-4">View and manage signage screens</p>
            <div className="text-[#64748b] text-sm italic">Manage screen profiles and active status</div>
          </a>

          <a href="/admin/values" className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 hover:border-blue-500 transition-colors block">
            <h2 className="text-lg font-semibold text-white mb-1">💡 Values</h2>
            <p className="text-[#64748b] text-sm mb-4">Edit company values shown on display</p>
            <div className="text-[#64748b] text-sm italic">Add, edit and reorder company values</div>
          </a>

          <a href="/admin/quotes" className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 hover:border-blue-500 transition-colors block">
            <h2 className="text-lg font-semibold text-white mb-1">💬 Quotes</h2>
            <p className="text-[#64748b] text-sm mb-4">Manage rotating quotes</p>
            <div className="text-[#64748b] text-sm italic">Add, edit and remove inspirational quotes</div>
          </a>

          <a href="/admin/locations" className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 hover:border-blue-500 transition-colors block">
            <h2 className="text-lg font-semibold text-white mb-1">📍 Locations</h2>
            <p className="text-[#64748b] text-sm mb-4">Set weather and surf locations per screen</p>
            <div className="text-[#64748b] text-sm italic">Manage location profiles with lat/lon coordinates</div>
          </a>

          <a href="/admin/deals" className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 hover:border-blue-500 transition-colors block md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-1">📈 Deal Tracker</h2>
            <p className="text-[#64748b] text-sm mb-4">Track open opportunities through to close, with Outlook email sync</p>
            <div className="text-[#64748b] text-sm italic">Pipeline, contacts, assigned actions and linked emails (sign-in required)</div>
          </a>
        </div>

        <div className="mt-10 bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">✅ System Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-[#64748b]">Open-Meteo Weather API</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-[#64748b]">TomTom Traffic (configure key)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-[#64748b]">ECR Radio Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-[#64748b]">Supabase Backend</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-blue-500 transition-colors"
          >
            → View Signage Display
          </a>
        </div>
      </div>
    </div>
  );
}
