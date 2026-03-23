'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { getFillColor, formatNumber, formatDateTime } from '@/lib/utils';

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listZones()
      .then(z => setZones(z))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Header title="Zone Management" subtitle="Loading zones..." />
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  );

  return (
    <div>
      <Header title="Zone Management" subtitle={`${zones.length} zones configured`} />
      <div style={{ padding: 32 }}>
        <div className="grid-auto stagger">
          {zones.map((zone) => (
            <div key={zone.zone_id} className="glass-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              {/* Gradient accent top */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `var(--gradient-${getFillColor(zone.avg_fill_level)})`,
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{zone.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{zone.zone_id}</div>
                  {zone.city && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {zone.city}</div>}
                </div>
                <span className={`badge badge-${zone.avg_fill_level > 60 ? 'orange' : 'green'}`}>
                  {zone.collection_frequency}
                </span>
              </div>

              <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-green)' }}>{zone.total_bins}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Bins</div>
                </div>
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-blue)' }}>{zone.active_bins}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Average Fill Level</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: `var(--accent-${getFillColor(zone.avg_fill_level)})` }}>
                    {zone.avg_fill_level}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className={`fill ${getFillColor(zone.avg_fill_level)}`}
                    style={{ width: `${zone.avg_fill_level}%` }} />
                </div>
              </div>

              {zone.description && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-primary)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {zone.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
