'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { formatNumber, getFillColor } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [composition, setComposition] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getZonePerformance(),
      api.getWasteComposition()
    ]).then(([dashData, zoneData, compData]) => {
      setStats(dashData);
      setZones(zoneData);
      setComposition(compData);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Header title="Dashboard" subtitle="Loading overview..." />
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  );

  const kpis = [
    { label: 'Total Bins', value: formatNumber(stats?.total_bins || 0), icon: '🗑️', color: 'green', change: '+3 this week', up: true },
    { label: 'Active Alerts', value: stats?.active_alerts || 0, icon: '🚨', color: 'red', change: stats?.active_alerts > 5 ? 'Needs attention' : 'Under control', up: false },
    { label: 'Avg Fill Level', value: `${stats?.avg_fill_level || 0}%`, icon: '📊', color: 'blue', change: stats?.avg_fill_level > 60 ? 'Collection needed' : 'Healthy', up: stats?.avg_fill_level <= 60 },
    { label: 'Fleet Vehicles', value: stats?.total_vehicles || 0, icon: '🚛', color: 'purple' },
    { label: 'Total Waste (kg)', value: formatNumber(stats?.total_waste_kg || 0), icon: '⚖️', color: 'orange' },
    { label: 'Co₂ Saved (kg)', value: formatNumber(stats?.co2_saved_kg || 0), icon: '🌱', color: 'green', change: 'Environmental impact', up: true },
    { label: 'Recycling Rate', value: `${stats?.recycling_rate || 0}%`, icon: '♻️', color: 'blue' },
    { label: 'Collections', value: formatNumber(stats?.total_collections || 0), icon: '📦', color: 'purple' },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Real-time waste management overview" />
      <div style={{ padding: '32px' }}>
        {/* KPI Cards */}
        <div className="grid-4 stagger" style={{ marginBottom: 32 }}>
          {kpis.map((kpi, i) => (
            <div key={i} className={`glass-card stat-card ${kpi.color}`}>
              <div className="stat-icon">{kpi.icon}</div>
              <div className="stat-value">{kpi.value}</div>
              <div className="stat-label">{kpi.label}</div>
              {kpi.change && (
                <div className={`stat-change ${kpi.up ? 'positive' : 'negative'}`}>
                  {kpi.up ? '↑' : '↓'} {kpi.change}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zone Performance + Waste Composition */}
        <div className="grid-2" style={{ marginBottom: 32 }}>
          {/* Zone Performance */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              📍 Zone Performance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {zones.slice(0, 5).map((z, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{z.zone_name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {z.total_bins} bins • {z.avg_fill_level}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className={`fill ${getFillColor(z.avg_fill_level)}`}
                        style={{ width: `${z.avg_fill_level}%` }} />
                    </div>
                  </div>
                  <span className={`badge badge-${getFillColor(z.avg_fill_level)}`}>
                    {z.efficiency_score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Waste Composition */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              ♻️ Waste Composition
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {composition.map((c, i) => {
                const colors = { general: 'blue', recyclable: 'green', organic: 'orange', hazardous: 'red', 'e-waste': 'purple' };
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
                        {c.type?.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {c.count} bins ({c.percentage}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className={`fill ${colors[c.type] || 'green'}`}
                        style={{ width: `${c.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Environment Impact */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
            🌍 Environmental Impact Summary
          </h3>
          <div className="grid-4 stagger">
            {[
              { icon: '🌳', label: 'Trees Equivalent', value: stats?.co2_saved_kg ? Math.round(stats.co2_saved_kg / 21.77) : 0, color: 'green' },
              { icon: '⛽', label: 'Fuel Saved (L)', value: stats?.total_collections ? Math.round(stats.total_collections * 0.8) : 0 , color: 'blue' },
              { icon: '🏭', label: 'CO₂ Reduced (kg)', value: formatNumber(stats?.co2_saved_kg || 0), color: 'purple' },
              { icon: '📦', label: 'Landfill Diverted (kg)', value: formatNumber(Math.round((stats?.total_waste_kg || 0) * 0.35)), color: 'orange' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: `var(--accent-${item.color})` }}>{item.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
