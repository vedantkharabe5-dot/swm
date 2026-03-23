'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.bg}>
        <div style={{ ...s.orb, width: 400, height: 400, top: '-10%', right: '-10%', background: 'rgba(16,185,129,0.08)', filter: 'blur(80px)' }} />
        <div style={{ ...s.orb, width: 300, height: 300, bottom: '10%', left: '-5%', background: 'rgba(59,130,246,0.08)', filter: 'blur(80px)' }} />
      </div>
      <div style={s.card}>
        <div style={s.logo}>♻️</div>
        <h1 style={s.title}>Welcome Back</h1>
        <p style={s.subtitle}>Sign in to SmartWaste Pro</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div>
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="admin@smartwaste.pro"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: '100%' }}>
            {loading ? 'Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div style={s.demoBox}>
          <p style={s.demoTitle}>Demo Accounts:</p>
          <div style={s.demoAccount} onClick={() => setForm({ email: 'admin@smartwaste.pro', password: 'admin123' })}>
            <strong>Admin:</strong> admin@smartwaste.pro / admin123
          </div>
          <div style={s.demoAccount} onClick={() => setForm({ email: 'operator@smartwaste.pro', password: 'operator123' })}>
            <strong>Operator:</strong> operator@smartwaste.pro / operator123
          </div>
          <div style={s.demoAccount} onClick={() => setForm({ email: 'citizen@smartwaste.pro', password: 'citizen123' })}>
            <strong>Citizen:</strong> citizen@smartwaste.pro / citizen123
          </div>
        </div>

        <p style={s.footer}>
          Don't have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, background: 'var(--bg-primary)', position: 'relative',
  },
  bg: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  orb: { position: 'absolute', borderRadius: '50%' },
  card: {
    width: '100%', maxWidth: 440, padding: 40, background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)', borderRadius: 20,
    backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1,
  },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)' },
  subtitle: { fontSize: 14, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32 },
  error: {
    padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, color: '#f87171', fontSize: 14, marginBottom: 20, textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  demoBox: {
    marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-primary)', borderRadius: 12,
  },
  demoTitle: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' },
  demoAccount: {
    fontSize: 12, color: 'var(--text-secondary)', padding: '6px 0', cursor: 'pointer',
    transition: 'color 0.15s',
  },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' },
};
