'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { getFillColor, getBinTypeIcon, getStatusColor, formatTimeAgo } from '@/lib/utils';

export default function BinsPage() {
  const [bins, setBins] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ zone_id: '', status: '', bin_type: '' });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const params = {};
      if (filter.zone_id) params.zone_id = filter.zone_id;
      if (filter.status) params.status = filter.status;
      if (filter.bin_type) params.bin_type = filter.bin_type;

      const [binsData, statsData] = await Promise.all([
        api.listBins(params),
        api.getBinStats()
      ]);
      setBins(binsData);
      setStats(statsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Header title="Smart Bins" subtitle={`${bins.length} bins monitored across all zones`} />
      <div style={{ padding: 32 }}>
        {/* Stats Row */}
        {stats && (
          <div className="grid-4 stagger" style={{ marginBottom: 32 }}>
            <div className="glass-card stat-card green">
              <div className="stat-icon">🗑️</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Bins</div>
            </div>
            <div className="glass-card stat-card blue">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="glass-card stat-card red">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{stats.full}</div>
              <div className="stat-label">Full (80%+)</div>
            </div>
            <div className="glass-card stat-card orange">
              <div className="stat-icon">🔧</div>
              <div className="stat-value">{stats.maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="input-field" style={{ width: 180 }} value={filter.zone_id}
            onChange={e => setFilter({ ...filter, zone_id: e.target.value })}>
            <option value="">All Zones</option>
            <option value="ZN-NORTH">North District</option>
            <option value="ZN-SOUTH">South District</option>
            <option value="ZN-EAST">East District</option>
            <option value="ZN-WEST">West District</option>
            <option value="ZN-CENTRAL">Central District</option>
          </select>
          <select className="input-field" style={{ width: 160 }} value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="full">Full</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          <select className="input-field" style={{ width: 160 }} value={filter.bin_type}
            onChange={e => setFilter({ ...filter, bin_type: e.target.value })}>
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="recyclable">Recyclable</option>
            <option value="organic">Organic</option>
            <option value="hazardous">Hazardous</option>
            <option value="e-waste">E-Waste</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('grid')}>Grid</button>
            <button className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('table')}>Table</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : view === 'grid' ? (
          /* Grid View */
          <div className="grid-auto stagger">
            {bins.map((bin) => (
              <div key={bin.bin_id} className="glass-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{getBinTypeIcon(bin.bin_type)}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{bin.bin_id}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bin.name}</div>
                  </div>
                  <span className={`badge badge-${getStatusColor(bin.status)}`}>
                    {bin.status}
                  </span>
                </div>

                {/* Fill Level Bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fill Level</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: `var(--accent-${getFillColor(bin.sensor_data?.fill_level)})` }}>
                      {bin.sensor_data?.fill_level?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div className={`fill ${getFillColor(bin.sensor_data?.fill_level)}`}
                      style={{ width: `${bin.sensor_data?.fill_level}%` }} />
                  </div>
                </div>

                {/* Sensor Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    🌡️ {bin.sensor_data?.temperature?.toFixed(1)}°C
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    💧 {bin.sensor_data?.humidity?.toFixed(1)}%
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    🔋 {bin.sensor_data?.battery_level?.toFixed(0)}%
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    📍 {bin.zone_id}
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-primary)', fontSize: 12, color: 'var(--text-muted)' }}>
                  Last reading: {formatTimeAgo(bin.sensor_data?.last_reading)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="glass-card" style={{ overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bin ID</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>Fill Level</th>
                  <th>Battery</th>
                  <th>Temp</th>
                  <th>Status</th>
                  <th>Last Reading</th>
                </tr>
              </thead>
              <tbody>
                {bins.map((bin) => (
                  <tr key={bin.bin_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bin.bin_id}</td>
                    <td>{getBinTypeIcon(bin.bin_type)} {bin.bin_type}</td>
                    <td>{bin.zone_id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80, height: 6 }}>
                          <div className={`fill ${getFillColor(bin.sensor_data?.fill_level)}`}
                            style={{ width: `${bin.sensor_data?.fill_level}%` }} />
                        </div>
                        <span style={{ fontWeight: 600, color: `var(--accent-${getFillColor(bin.sensor_data?.fill_level)})` }}>
                          {bin.sensor_data?.fill_level?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>{bin.sensor_data?.battery_level?.toFixed(0)}%</td>
                    <td>{bin.sensor_data?.temperature?.toFixed(1)}°C</td>
                    <td><span className={`badge badge-${getStatusColor(bin.status)}`}>{bin.status}</span></td>
                    <td>{formatTimeAgo(bin.sensor_data?.last_reading)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
