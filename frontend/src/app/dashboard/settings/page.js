'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = api.getUser();
    if (u) {
      setUser(u);
      setForm({ name: u.name || '', phone: u.phone || '' });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      api.setUser(updated);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <div style={{ padding: 32, maxWidth: 800 }}>
        {/* Profile */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>👤 Profile Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" value={user?.email || ''} disabled
                style={{ opacity: 0.6 }} />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input className="input-field" placeholder="+91-98765-43210" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Role</label>
              <input className="input-field" value={user?.role || ''} disabled
                style={{ opacity: 0.6, textTransform: 'capitalize' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
              {saved && <span style={{ color: 'var(--accent-green)', fontSize: 14 }}>✅ Saved successfully!</span>}
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>ℹ️ System Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px 24px', fontSize: 14 }}>
            <div style={{ color: 'var(--text-muted)' }}>Application</div>
            <div style={{ fontWeight: 600 }}>SmartWaste Pro</div>
            <div style={{ color: 'var(--text-muted)' }}>Version</div>
            <div style={{ fontWeight: 600 }}>1.0.0</div>
            <div style={{ color: 'var(--text-muted)' }}>Frontend</div>
            <div style={{ fontWeight: 600 }}>Next.js 16.0.10</div>
            <div style={{ color: 'var(--text-muted)' }}>Backend</div>
            <div style={{ fontWeight: 600 }}>FastAPI + Python 3.12</div>
            <div style={{ color: 'var(--text-muted)' }}>Database</div>
            <div style={{ fontWeight: 600 }}>MongoDB Atlas</div>
            <div style={{ color: 'var(--text-muted)' }}>API Base URL</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🔑 API Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Backend API Endpoint</label>
              <input className="input-field" value="http://localhost:8000" disabled
                style={{ opacity: 0.6, fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <label className="input-label">API Documentation</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm">📄 Swagger UI</a>
                <a href="http://localhost:8000/redoc" target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm">📋 ReDoc</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
