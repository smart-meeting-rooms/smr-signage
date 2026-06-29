'use client';
import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client (uses the anon key + cookie-based auth session).
//
// The real values are inlined at build time from NEXT_PUBLIC_* env vars. The
// fallback placeholders only ever apply in a build that has no env configured
// (e.g. CI type-check) — there `createBrowserClient` would otherwise throw and
// break the static shell of these client-rendered pages. At runtime in a
// configured deployment the real values are always present.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
