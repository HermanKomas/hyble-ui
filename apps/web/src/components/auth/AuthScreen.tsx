import { useState } from 'react';
import { useAuth } from '../../lib/auth.js';

export function AuthScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', background: 'var(--paper)' }}>
      {/* Left — brand panel */}
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', background: 'var(--paper-2)', borderRight: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="font-display" style={{ fontSize: 28 }}>hyble</span>
          <span className="eyebrow" style={{ fontSize: 9 }}>v2 · ai</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 460 }}>
          <p className="font-display" style={{ fontSize: 40, lineHeight: 1.18, color: 'var(--ink)', margin: 0 }}>
            Make a brand-compliant POS piece in the time it takes to{' '}
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>order one.</span>
          </p>
          <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 18 }}>
            Built for field reps. Brand kits, state rules, and chargeback metadata are already in the loop — you write the prompt, we handle the rest.
          </p>
        </div>
        <div className="eyebrow" style={{ marginTop: 'auto' }}>Edinburgh · Hyble Tech Ltd</div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Sign in</div>
            <div className="font-display" style={{ fontSize: 28 }}>Welcome back.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Work email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--warn)', padding: '8px 12px', background: 'var(--paper-2)', borderRadius: 'var(--r-2)', border: '1px solid var(--rule)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 4 }}>
            Don't have an account? Contact your Hyble admin.
          </div>
        </form>
      </div>
    </div>
  );
}
