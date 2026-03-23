'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('overview');
  const [reportForm, setReportForm] = useState({ report_type: 'overflow', description: '', bin_id: '' });
  const [pickupForm, setPickupForm] = useState({ address: '', waste_type: 'general', estimated_weight_kg: 5, preferred_date: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('swm_token');
    if (!token) { router.push('/login'); return; }
    const u = api.getUser();
    setUser(u);
    Promise.all([
      api.getMyRewards().catch(() => null),
      api.getLeaderboard().catch(() => []),
      api.getMyReports().catch(() => []),
    ]).then(([r, l, reps]) => {
      setRewards(r);
      setLeaderboard(l);
      setReports(reps);
    }).finally(() => setLoading(false));
  }, [router]);

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitReport(reportForm);
      setMessage('✅ Report submitted! You earned reward points.');
      setReportForm({ report_type: 'overflow', description: '', bin_id: '' });
      const [r, reps] = await Promise.all([api.getMyRewards(), api.getMyReports()]);
      setRewards(r);
      setReports(reps);
    } catch (err) { setMessage('❌ ' + err.message); }
    finally { setSubmitting(false); setTimeout(() => setMessage(''), 5000); }
  };

  const submitPickup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.schedulePickup({
        ...pickupForm,
        estimated_weight_kg: Number(pickupForm.estimated_weight_kg),
        preferred_date: new Date(pickupForm.preferred_date).toISOString(),
      });
      setMessage(`✅ ${res.message}`);
      setPickupForm({ address: '', waste_type: 'general', estimated_weight_kg: 5, preferred_date: '', notes: '' });
      setRewards(await api.getMyRewards());
    } catch (err) { setMessage('❌ ' + err.message); }
    finally { setSubmitting(false); setTimeout(() => setMessage(''), 5000); }
  };

  if (loading) return (
    <div style={s.container}>
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  );

  const tabs = [
    { key: 'overview', label: '🏠 Overview' },
    { key: 'report', label: '📝 Report Issue' },
    { key: 'pickup', label: '🚛 Schedule Pickup' },
    { key: 'leaderboard', label: '🏆 Leaderboard' },
  ];

  const levelColors = {
    'Eco Newbie': '#64748b', 'Bronze Collector': '#cd7f32',
    'Silver Sorter': '#c0c0c0', 'Gold Recycler': '#ffd700', 'Platinum Eco-Warrior': '#e5e4e2',
  };

  return (
    <div style={s.container}>
      <div style={s.inner}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏘️</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
            <span style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Citizen Portal
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back, {user?.name}! 🌿</p>
        </div>

        {message && (
          <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, textAlign: 'center', fontSize: 14, fontWeight: 600,
            background: message.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message.startsWith('✅') ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>{message}</div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: 'var(--bg-glass)', padding: 6, borderRadius: 12 }}>
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tab === t.key ? 'var(--accent-green-glow)' : 'transparent',
                color: tab === t.key ? 'var(--accent-green)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && rewards && (
          <div className="animate-in">
            {/* Rewards Card */}
            <div className="glass-card" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: levelColors[rewards.level] || 'var(--accent-green)', marginBottom: 8 }}>
                {rewards.total_points}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: levelColors[rewards.level] || 'var(--text-primary)', marginBottom: 4 }}>
                {rewards.level}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rank #{rewards.rank} on leaderboard</div>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="glass-card stat-card green" style={{ textAlign: 'center' }}>
                <div className="stat-value">{rewards.reports_submitted}</div>
                <div className="stat-label">Reports Filed</div>
              </div>
              <div className="glass-card stat-card blue" style={{ textAlign: 'center' }}>
                <div className="stat-value">{rewards.pickups_scheduled}</div>
                <div className="stat-label">Pickups Scheduled</div>
              </div>
              <div className="glass-card stat-card purple" style={{ textAlign: 'center' }}>
                <div className="stat-value">{rewards.recycling_score?.toFixed(0)}</div>
                <div className="stat-label">Eco Score</div>
              </div>
            </div>

            {/* Badges */}
            {rewards.badges?.length > 0 && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏅 Your Badges</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {rewards.badges.map((b, i) => (
                    <span key={i} className="badge badge-green" style={{ fontSize: 13, padding: '6px 14px' }}>
                      🏆 {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'report' && (
          <div className="glass-card animate-in" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>📝 Report an Issue</h3>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="input-label">Issue Type</label>
                <select className="input-field" value={reportForm.report_type}
                  onChange={e => setReportForm({ ...reportForm, report_type: e.target.value })}>
                  <option value="overflow">🚨 Bin Overflow</option>
                  <option value="illegal_dump">🚫 Illegal Dumping</option>
                  <option value="damaged_bin">🔧 Damaged Bin</option>
                  <option value="suggestion">💡 Suggestion</option>
                </select>
              </div>
              <div>
                <label className="input-label">Bin ID (optional)</label>
                <input className="input-field" placeholder="e.g. BIN-0001" value={reportForm.bin_id}
                  onChange={e => setReportForm({ ...reportForm, bin_id: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input-field" rows={4} placeholder="Describe the issue in detail..."
                  value={reportForm.description} required
                  onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                  style={{ resize: 'vertical', minHeight: 100 }} />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '📨 Submit Report (+10 points)'}
              </button>
            </form>
          </div>
        )}

        {tab === 'pickup' && (
          <div className="glass-card animate-in" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🚛 Schedule a Pickup</h3>
            <form onSubmit={submitPickup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="input-label">Pickup Address</label>
                <input className="input-field" placeholder="Full address..." value={pickupForm.address}
                  onChange={e => setPickupForm({ ...pickupForm, address: e.target.value })} required />
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="input-label">Waste Type</label>
                  <select className="input-field" value={pickupForm.waste_type}
                    onChange={e => setPickupForm({ ...pickupForm, waste_type: e.target.value })}>
                    <option value="general">🗑️ General</option>
                    <option value="recyclable">♻️ Recyclable</option>
                    <option value="organic">🌿 Organic</option>
                    <option value="e-waste">🔌 E-Waste</option>
                    <option value="hazardous">☢️ Hazardous</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Estimated Weight (kg)</label>
                  <input className="input-field" type="number" min="1" value={pickupForm.estimated_weight_kg}
                    onChange={e => setPickupForm({ ...pickupForm, estimated_weight_kg: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="input-label">Preferred Date</label>
                <input className="input-field" type="datetime-local" value={pickupForm.preferred_date}
                  onChange={e => setPickupForm({ ...pickupForm, preferred_date: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Notes (optional)</label>
                <textarea className="input-field" rows={3} placeholder="Any special instructions..."
                  value={pickupForm.notes}
                  onChange={e => setPickupForm({ ...pickupForm, notes: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                {submitting ? '⏳ Scheduling...' : '📅 Schedule Pickup (+15 points)'}
              </button>
            </form>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="glass-card animate-in" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🏆 Eco Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaderboard.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                  background: i < 3 ? 'rgba(16,185,129,0.05)' : 'var(--bg-glass)',
                  borderRadius: 12, border: '1px solid var(--border-primary)',
                }}>
                  <span style={{
                    fontSize: i < 3 ? 24 : 18, fontWeight: 800, width: 40, textAlign: 'center',
                    color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.zone_id || 'No zone'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)' }}>{entry.points}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px 24px',
  },
  inner: { maxWidth: 700, margin: '0 auto' },
};
