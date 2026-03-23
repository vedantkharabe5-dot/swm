'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { getStatusColor, formatDateTime } from '@/lib/utils';

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listVehicles(), api.getVehicleStats()])
      .then(([v, s]) => { setVehicles(v); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Header title="Fleet Management" subtitle="Loading fleet data..." />
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  );

  return (
    <div>
      <Header title="Fleet Management" subtitle={`${vehicles.length} vehicles in fleet`} />
      <div style={{ padding: 32 }}>
        {/* Stats */}
        {stats && (
          <div className="grid-4 stagger" style={{ marginBottom: 32 }}>
            <div className="glass-card stat-card green">
              <div className="stat-icon">🚛</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Vehicles</div>
            </div>
            <div className="glass-card stat-card blue">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.available}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="glass-card stat-card purple">
              <div className="stat-icon">🗺️</div>
              <div className="stat-value">{stats.on_route}</div>
              <div className="stat-label">On Route</div>
            </div>
            <div className="glass-card stat-card orange">
              <div className="stat-icon">🔧</div>
              <div className="stat-value">{stats.maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        )}

        {/* Vehicle Grid */}
        <div className="grid-auto stagger">
          {vehicles.map((v) => (
            <div key={v.vehicle_id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{v.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.vehicle_id}</div>
                </div>
                <span className={`badge badge-${getStatusColor(v.status)}`}>{v.status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Type</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v.vehicle_type?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Capacity</div>
                  <div style={{ fontWeight: 600 }}>{(v.capacity_kg / 1000).toFixed(1)}T</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Driver</div>
                  <div style={{ fontWeight: 600 }}>{v.driver_name || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Fuel</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                      <div className={`fill ${v.fuel_level > 50 ? 'green' : v.fuel_level > 20 ? 'orange' : 'red'}`}
                        style={{ width: `${v.fuel_level}%` }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{v.fuel_level?.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>📦 {v.total_collections} collections</span>
                <span>🛣️ {v.total_distance_km?.toFixed(0)} km</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
