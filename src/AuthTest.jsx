// Plan Day 6 — isolated magic-link auth test screen.
// Reachable ONLY at ?authtest=1. Never rendered in the normal app path.
// Zero imports from AgentTrainer.jsx; zero effect on production surface.

import { useEffect, useState } from 'react';
import { supabase, sbReady } from './supabase.js';

const wrap = {
  minHeight: '100vh', background: '#0b0b0c', color: '#e8e8ea',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '24px 18px', boxSizing: 'border-box',
};
const card = {
  maxWidth: 520, margin: '0 auto', background: '#141416',
  border: '1px solid #2a2a2e', borderRadius: 12, padding: 18,
};
const label = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a8a92' };
const mono = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, wordBreak: 'break-all' };
const input = {
  width: '100%', padding: '12px 14px', fontSize: 16, borderRadius: 8,
  border: '1px solid #33333a', background: '#0f0f11', color: '#e8e8ea',
  boxSizing: 'border-box', marginTop: 8,
};
const btn = {
  width: '100%', padding: '14px', fontSize: 16, fontWeight: 600, marginTop: 12,
  borderRadius: 8, border: 'none', background: '#c8442a', color: '#fff',
  // Long-press on iOS selects button text and pops the Copy/Look Up menu
  // instead of firing the tap. Kill selection and the tap-highlight.
  WebkitUserSelect: 'none', userSelect: 'none',
  WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
};
// A disabled button must LOOK disabled — a silent no-op reads as a broken app.
const btnOff = { ...btn, background: '#3a2420', color: '#8a6a62' };
const btnAlt = { ...btn, background: '#2a2a2e' };

export default function AuthTest() {
  const [email, setEmail] = useState('chris@kameir.com');
  const [session, setSession] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sbReady()) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendLink = async () => {
    setBusy(true); setMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + '/?authtest=1' },
      });
      setMsg(error ? 'ERROR: ' + error.message : 'Link sent. Open it on this device.');
    } catch (e) {
      setMsg('ERROR: ' + (e?.message || String(e)));
    }
    setBusy(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); setMsg('Signed out.'); };

  if (!sbReady()) {
    return (
      <div style={wrap}><div style={card}>
        <h2 style={{ marginTop: 0 }}>Auth Test — NOT CONFIGURED</h2>
        <p style={{ color: '#f0a', ...mono }}>
          VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from this build.
        </p>
        <p style={{ color: '#8a8a92', fontSize: 14 }}>
          Set both in Netlify → Site configuration → Environment variables, then
          trigger a redeploy. Vite inlines VITE_* at build time; existing builds
          will not pick them up.
        </p>
      </div></div>
    );
  }

  return (
    <div style={wrap}><div style={card}>
      <h2 style={{ marginTop: 0 }}>Auth Test <span style={{ color: '#8a8a92', fontSize: 14 }}>(Plan Day 6)</span></h2>

      <div style={label}>Session</div>
      {session ? (
        <>
          <div style={{ ...mono, color: '#5ad18a', marginTop: 6 }}>AUTHENTICATED</div>
          <div style={{ ...label, marginTop: 14 }}>User UUID</div>
          <div style={{ ...mono, marginTop: 6 }}>{session.user.id}</div>
          <div style={{ ...label, marginTop: 14 }}>Email</div>
          <div style={{ ...mono, marginTop: 6 }}>{session.user.email}</div>
          <button style={btnAlt} onClick={signOut}>Sign out</button>
        </>
      ) : (
        <>
          <div style={{ ...mono, color: '#8a8a92', marginTop: 6 }}>anonymous</div>
          <div style={{ ...label, marginTop: 18 }}>Email</div>
          <input
            style={input} type="email" inputMode="email" autoCapitalize="none"
            autoCorrect="off" placeholder="chris@kameir.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button
            style={busy || !email.trim() ? btnOff : btn}
            disabled={busy || !email.trim()}
            onClick={sendLink}
          >
            {busy ? 'Sending…' : 'Send magic link'}
          </button>
          {!email.trim() && (
            <div style={{ fontSize: 13, color: '#8a8a92', marginTop: 8 }}>
              Enter an email address to enable the button.
            </div>
          )}
        </>
      )}

      {msg && <div style={{ ...mono, marginTop: 14, color: msg.startsWith('ERROR') ? '#ff6b6b' : '#5ad18a' }}>{msg}</div>}

      <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid #2a2a2e' }}>
        <a href="/" style={{ color: '#8a8a92', fontSize: 14 }}>← back to IronQ</a>
      </div>
    </div></div>
  );
}
