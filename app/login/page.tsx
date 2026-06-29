'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

// Microsoft Graph scopes we need: sign-in + read the user's mail.
// offline_access is required so we receive a refresh token for background sync.
const MS_SCOPES =
  'openid profile email offline_access User.Read Mail.Read';

function LoginInner() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirect = params.get('redirect') || '/admin/deals';

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: MS_SCOPES,
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirect
        )}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] flex items-center justify-center p-6">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white">Deal Tracker</h1>
        <p className="text-[#64748b] mt-2 mb-8">
          Sign in with your Microsoft 365 account to manage deals and sync your
          Outlook email.
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-[#1e1e2e] rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="#f25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
            <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
            <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
          </svg>
          {loading ? 'Redirecting…' : 'Sign in with Microsoft'}
        </button>

        <a
          href="/admin"
          className="block text-center text-[#64748b] hover:text-white text-sm mt-6"
        >
          ← Back to admin
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
