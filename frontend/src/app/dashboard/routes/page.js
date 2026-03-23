'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { formatNumber } from '@/lib/utils';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');

  useEffect(() => {
    Promise.all([api.listRoutes(), api.listVehicles()])
      .then(([r, v]) => { setRoutes(r); setVehicles(v); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOptimize = async () => {
    if (!selectedZone) return alert('Please select a zone');
    setOptimizing(true);
    try {
      const available = vehicles.find(v => v.status === 'available');
      const newRoute = await api.optimizeRoute({
        zone_id: selectedZone,
        vehicle_id: available?.vehicle_id || null,
        priority: 3,
        scheduled_date: new Date().toISOString(),
      });
      setRoutes(prev => [newRoute, ...prev]);
    } catch (err) {
      alert(err.message || 'Optimization failed');
    } finally { setOptimizing(false); }
  };

  const statusColors = { planned: '#3b82f6', in_progress: '#f59e0b', completed: '#10b981', cancelled: '#64748b' };

  return (
    <div>
      <Header title="Route Optimizer" subtitle="AI-powered collection route planning" />
      <div style={{ padding: 32 }}>
        {/* Action Bar */}
        <div className="glass-card" style={{ padding: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 24 }}>🗺️</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Generate Optimized Route</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Our AI selects bins with fill level ≥60% and calculates the shortest path using nearest-neighbor optimization.
            </div>
          </div>
          <select className="input-field" style={{ width: 200 }} value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}>
            <option value="">Select Zone</option>
            <option value="ZN-NORTH">North District</option>
            <option value="ZN-SOUTH">South District</option>
            <option value="ZN-EAST">East District</option>
            <option value="ZN-WEST">West District</option>
            <option value="ZN-CENTRAL">Central District</option>
          </select>
          <button className="btn btn-primary" onClick={handleOptimize} disabled={optimizing}>
            {optimizing ? '⏳ Optimizing...' : '🚀 Optimize Route'}
          </button>
        </div>

        {/* Routes List */}
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger">
            {routes.map((route) => (
              <div key={route.route_id} className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{route.route_id}</span>
                      <span className={`badge badge-${route.status === 'completed' ? 'green' : route.status === 'in_progress' ? 'orange' : 'blue'}`}>
                        {route.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Zone: {route.zone_id} • Vehicle: {route.vehicle_id || 'Unassigned'}
                      {route.driver_name && ` • Driver: ${route.driver_name}`}
                    </div>
                  </div>
                </div>

                <div className="grid-4" style={{ gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>{route.total_bins}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Bins</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>{route.total_distance_km} km</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Distance</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-purple)' }}>{route.estimated_duration_min} min</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Est. Duration</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-orange)' }}>{route.collected_bins}/{route.total_bins}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collected</div>
                  </div>
                </div>

                {/* Waypoints */}
                {route.waypoints && route.waypoints.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Route Stops:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {route.waypoints.map((wp, i) => (
                        <span key={i} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)',
                          background: wp.collected ? 'rgba(16,185,129,0.15)' : 'var(--bg-glass)',
                          color: wp.collected ? 'var(--accent-green)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-primary)',
                        }}>
                          {wp.order}. {wp.bin_id} {wp.collected ? '✓' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {routes.length === 0 && (
              <div className="empty-state">
                <div className="icon">🗺️</div>
                <h3>No routes yet</h3>
                <p>Select a zone and click "Optimize Route" to generate your first AI-optimized collection route.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
