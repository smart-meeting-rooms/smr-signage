import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceClient } from '../../../lib/supabase/server';

// OAuth redirect target. Exchanges the auth code for a session and stashes the
// Microsoft Graph refresh token so the email-sync route can call Graph later.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirect = url.searchParams.get('redirect') || '/admin/deals';
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message || 'auth_failed')}`
    );
  }

  // Persist the provider (Microsoft) tokens for background Graph access.
  const session = data.session;
  if (session.provider_refresh_token || session.provider_token) {
    try {
      const service = createServiceClient();
      await service.from('crm_ms_tokens').upsert({
        user_id: session.user.id,
        refresh_token: session.provider_refresh_token ?? null,
        access_token: session.provider_token ?? null,
        // provider_token is short-lived; treat it as ~1h.
        expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Non-fatal: the user is still signed in, email sync just won't work
      // until SUPABASE_SERVICE_ROLE_KEY is configured.
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
