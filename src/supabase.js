// Supabase client init. Plan Day 5.
// NOT wired into the app. Nothing imports this yet by design.
//
// Env (Netlify → Site settings → Environment variables):
//   VITE_SUPABASE_URL       https://drgffhoigdocwbusincp.supabase.co
//   VITE_SUPABASE_ANON_KEY  sb_publishable_...   (publishable key — safe in bundle)
//
// The service-role key must NEVER appear here or anywhere in the client bundle.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Missing env must not throw at module load — an unconfigured build has to keep
// booting normally. Callers check sbReady() first. Same swallow-everything
// posture as F-BACKUP2: the backend never blocks a workout.
export const sbReady = () => Boolean(url && anonKey);

export const supabase = sbReady()
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // magic-link callback lands in the URL hash
        storageKey: 'ig_sb_auth',
      },
    })
  : null;

// Console probe for manual verification (Day 6/7). No production surface.
if (typeof window !== 'undefined') {
  window.igSbStatus = () => ({
    ready: sbReady(),
    url: url || null,
    keyPrefix: anonKey ? anonKey.slice(0, 18) + '…' : null,
  });
}
