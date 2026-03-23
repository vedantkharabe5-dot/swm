'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { getAlertIcon, getPriorityColor, getStatusColor, formatTimeAgo } from '@/lib/utils';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [filter]);

  const loadData = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const [a, s] = await Promise.all([api.listAlerts(params), api.getAlertStats()]);
      setAlerts(a);
      setStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (alertId, action) => {
    try {
      if (action === 'acknowledge') await api.acknowledgeAlert(alertId);
      else if (action === 'resolve') await api.resolveAlert(alertId);
      else if (action === 'dismiss') await api.dismissAlert(alertId);
      loadData();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <Header title="Alert Center" subtitle={`${stats?.active || 0} active alerts requiring attention`} />
      <div style={{ padding: 32 }}>
        {stats && (
          <div className="grid-4 stagger" style={{ marginBottom: 32 }}>
            <div className="glass-card stat-card red">
              <div className="stat-icon">🚨</div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active Alerts</div>
            </div>
            <div className="glass-card stat-card orange">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{stats.critical}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="glass-card stat-card blue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{stats.high}</div>
              <div className="stat-label">High Priority</div>
            </div>
            <div className="glass-card stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.resolved_today}</div>
              <div className="stat-label">Resolved Today</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <select className="input-field" style={{ width: 180 }} value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select className="input-field" style={{ width: 160 }} value={filter.priority}
            onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
            {alerts.map((alert) => (
              <div key={alert.alert_id} className="glass-card" style={{ padding: 20, borderLeft: `4px solid var(--accent-${getPriorityColor(alert.priority)})` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ fontSize: 28 }}>{getAlertIcon(alert.alert_type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{alert.title}</span>
                      <span className={`badge badge-${getPriorityColor(alert.priority)}`}>{alert.priority}</span>
                      <span className={`badge badge-${getStatusColor(alert.status)}`}>{alert.status}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{alert.message}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                      {alert.bin_id && <span>🗑️ {alert.bin_id}</span>}
                      {alert.zone_id && <span>📍 {alert.zone_id}</span>}
                      <span>⏰ {formatTimeAgo(alert.created_at)}</span>
                      {alert.acknowledged_by && <span>👤 {alert.acknowledged_by}</span>}
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleAction(alert.alert_id, 'acknowledge')}>Acknowledge</button>
                      <button className="btn btn-sm btn-primary" onClick={() => handleAction(alert.alert_id, 'resolve')}>Resolve</button>
                    </div>
                  )}
                  {alert.status === 'acknowledged' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleAction(alert.alert_id, 'resolve')}>Resolve</button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="empty-state">
                <div className="icon">🎉</div>
                <h3>No alerts found</h3>
                <p>Everything looks good! No alerts match your current filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
