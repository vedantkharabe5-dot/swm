export function formatNumber(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatTimeAgo(date) {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function getFillColor(level) {
  if (level >= 80) return 'red';
  if (level >= 50) return 'orange';
  return 'green';
}

export function getFillLabel(level) {
  if (level >= 90) return 'Critical';
  if (level >= 80) return 'Almost Full';
  if (level >= 50) return 'Moderate';
  if (level >= 20) return 'Low';
  return 'Empty';
}

export function getBinTypeIcon(type) {
  const icons = {
    general: '🗑️', recyclable: '♻️', organic: '🌿', hazardous: '☢️', 'e-waste': '🔌'
  };
  return icons[type] || '🗑️';
}

export function getAlertIcon(type) {
  const icons = {
    overflow: '🚨', maintenance: '🔧', anomaly: '⚠️', battery_low: '🔋',
    temperature: '🌡️', methane: '💨', offline: '📡', collection_missed: '🚛'
  };
  return icons[type] || '⚠️';
}

export function getPriorityColor(priority) {
  const colors = { critical: 'red', high: 'orange', medium: 'blue', low: 'green' };
  return colors[priority] || 'gray';
}

export function getStatusColor(status) {
  const colors = {
    active: 'green', full: 'red', maintenance: 'orange', offline: 'gray',
    available: 'green', on_route: 'blue', planned: 'blue', in_progress: 'orange',
    completed: 'green', cancelled: 'gray', pending: 'orange', acknowledged: 'blue',
    resolved: 'green', dismissed: 'gray', scheduled: 'blue'
  };
  return colors[status] || 'gray';
}
