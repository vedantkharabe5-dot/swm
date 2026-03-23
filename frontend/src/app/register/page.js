'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>♻️</div>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.subtitle}>Join SmartWaste Pro</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div>
            <label className="input-label">Full Name</label>
            <input className="input-field" placeholder="John Doe" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input className="input-field" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="input-label">Phone (optional)</label>
            <input className="input-field" placeholder="+91-98765-43210" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Role</label>
            <select className="input-field" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="citizen">Citizen</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: '100%' }}>
            {loading ? 'Creating...' : '🚀 Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, background: 'var(--bg-primary)',
  },
  card: {
    width: '100%', maxWidth: 440, padding: 40, background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)', borderRadius: 20, backdropFilter: 'blur(20px)',
  },
  title: { fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)' },
  subtitle: { fontSize: 14, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32 },
  error: {
    padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, color: '#f87171', fontSize: 14, marginBottom: 20, textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
};
