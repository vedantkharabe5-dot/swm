'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { formatNumber, getFillColor } from '@/lib/utils';

export default function AnalyticsPage() {
  const [impact, setImpact] = useState(null);
  const [zones, setZones] = useState([]);
  const [composition, setComposition] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getEnvironmentalImpact(),
      api.getZonePerformance(),
      api.getWasteComposition(),
      api.getPredictions(),
      api.getTrends(30),
    ]).then(([imp, z, c, p, t]) => {
      setImpact(imp);
      setZones(z);
      setComposition(c);
      setPredictions(p?.predictions || []);
      setTrends(t?.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <Header title="Analytics & Insights" subtitle="Loading analytics..." />
      <div className="loading-container"><div className="spinner" /></div>
    </div>
  );

  const urgencyColors = { critical: 'red', high: 'orange', medium: 'blue', low: 'green' };

  return (
    <div>
      <Header title="Analytics & Insights" subtitle="Predictive analytics and performance metrics" />
      <div style={{ padding: 32 }}>
        {/* Environmental Impact */}
        {impact && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🌍 Environmental Impact</h3>
            <div className="grid-4">
              {[
                { icon: '♻️', label: 'Recycling Rate', value: `${impact.recycling_rate}%`, color: 'green' },
                { icon: '🌳', label: 'Trees Equivalent', value: impact.trees_equivalent, color: 'green' },
                { icon: '🏭', label: 'CO₂ Saved (kg)', value: formatNumber(impact.co2_saved_kg), color: 'blue' },
                { icon: '⛽', label: 'Fuel Saved (L)', value: formatNumber(impact.fuel_saved_liters), color: 'purple' },
                { icon: '📦', label: 'Waste Collected (kg)', value: formatNumber(impact.total_waste_collected_kg), color: 'orange' },
                { icon: '🚛', label: 'Routes Completed', value: impact.total_routes_completed, color: 'blue' },
                { icon: '🛣️', label: 'Distance Optimized (km)', value: formatNumber(impact.total_distance_optimized_km), color: 'purple' },
                { icon: '🗑️', label: 'Landfill Diverted (kg)', value: formatNumber(impact.landfill_diverted_kg), color: 'green' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: `var(--accent-${item.color})` }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 32 }}>
          {/* Zone Performance Ranking */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📍 Zone Ranking</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {zones.map((z, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: i < 3 ? 'var(--accent-green)' : 'var(--text-muted)', width: 30 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{z.zone_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{z.total_bins} bins</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: `var(--accent-${getFillColor(z.avg_fill_level)})` }}>
                      {z.avg_fill_level}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>avg fill</div>
                  </div>
                  <span className={`badge badge-${z.efficiency_score > 60 ? 'green' : z.efficiency_score > 30 ? 'orange' : 'red'}`}>
                    {z.efficiency_score}% eff
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fill Level Predictions */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🔮 Fill Predictions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {predictions.slice(0, 10).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <span className={`badge badge-${urgencyColors[p.urgency]}`}>{p.urgency}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.bin_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.hours_until_full <= 0 ? 'Already full!' :
                        p.hours_until_full < 24 ? `Full in ${p.hours_until_full.toFixed(1)}h` :
                          `Full in ${(p.hours_until_full / 24).toFixed(1)} days`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.current_fill}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{p.daily_fill_rate}%/day</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collection Trends (text-based chart) */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📈 Collection Trends (Last 30 Days)</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200, padding: '0 8px' }}>
              {trends.slice(-30).map((d, i) => {
                const maxCollections = Math.max(...trends.map(t => t.collections), 1);
                const height = (d.collections / maxCollections) * 160;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 20 }}
                    title={`${d.date}: ${d.collections} collections, ${d.weight_kg}kg`}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.collections}</span>
                    <div style={{
                      width: '100%', height, borderRadius: '4px 4px 0 0',
                      background: `var(--gradient-green)`, opacity: 0.6 + (d.collections / maxCollections) * 0.4,
                      transition: 'height 0.5s ease',
                    }} />
                    <span style={{ fontSize: 8, color: 'var(--text-muted)', whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
                      {d.date?.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
