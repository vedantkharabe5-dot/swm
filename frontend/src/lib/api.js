const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = null;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('swm_token');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('swm_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('swm_token');
      localStorage.removeItem('swm_user');
    }
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('swm_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swm_user', JSON.stringify(user));
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ─── Auth ───
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.access_token);
    this.setUser(data.user);
    return data;
  }

  async register(userData) {
    const data = await this.post('/auth/register', userData);
    this.setToken(data.access_token);
    this.setUser(data.user);
    return data;
  }

  getProfile() { return this.get('/auth/profile'); }
  updateProfile(data) { return this.put('/auth/profile', data); }
  listUsers(role) { return this.get(`/auth/users${role ? `?role=${role}` : ''}`); }

  // ─── Bins ───
  listBins(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/bins${qs ? `?${qs}` : ''}`);
  }
  getBin(binId) { return this.get(`/bins/${binId}`); }
  getBinStats() { return this.get('/bins/stats'); }
  createBin(data) { return this.post('/bins', data); }
  updateBin(binId, data) { return this.put(`/bins/${binId}`, data); }
  deleteBin(binId) { return this.delete(`/bins/${binId}`); }
  updateBinSensor(binId, data) { return this.put(`/bins/${binId}/sensor`, data); }

  // ─── Fleet ───
  listVehicles(status) { return this.get(`/fleet/vehicles${status ? `?status=${status}` : ''}`); }
  createVehicle(data) { return this.post('/fleet/vehicles', data); }
  getVehicle(id) { return this.get(`/fleet/vehicles/${id}`); }
  updateVehicle(id, data) { return this.put(`/fleet/vehicles/${id}`, data); }
  deleteVehicle(id) { return this.delete(`/fleet/vehicles/${id}`); }
  getVehicleStats() { return this.get('/fleet/vehicles/stats/overview'); }

  // ─── Routes ───
  listRoutes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/fleet/routes${qs ? `?${qs}` : ''}`);
  }
  optimizeRoute(data) { return this.post('/fleet/routes/optimize', data); }
  updateRouteStatus(routeId, status) { return this.put(`/fleet/routes/${routeId}/status?new_status=${status}`, {}); }

  // ─── Analytics ───
  getDashboard() { return this.get('/analytics/dashboard'); }
  getTrends(days = 30) { return this.get(`/analytics/trends?days=${days}`); }
  getZonePerformance() { return this.get('/analytics/zone-performance'); }
  getPredictions(zoneId) { return this.get(`/analytics/predictions${zoneId ? `?zone_id=${zoneId}` : ''}`); }
  getWasteComposition() { return this.get('/analytics/waste-composition'); }
  getEnvironmentalImpact() { return this.get('/analytics/environmental-impact'); }

  // ─── Alerts ───
  listAlerts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/alerts${qs ? `?${qs}` : ''}`);
  }
  getAlertStats() { return this.get('/alerts/stats'); }
  acknowledgeAlert(id) { return this.put(`/alerts/${id}/acknowledge`, {}); }
  resolveAlert(id) { return this.put(`/alerts/${id}/resolve`, {}); }
  dismissAlert(id) { return this.put(`/alerts/${id}/dismiss`, {}); }

  // ─── Citizens ───
  submitReport(data) { return this.post('/citizens/reports', data); }
  getMyReports() { return this.get('/citizens/reports'); }
  getAllReports(status) { return this.get(`/citizens/reports/all${status ? `?status=${status}` : ''}`); }
  schedulePickup(data) { return this.post('/citizens/pickups', data); }
  getMyRewards() { return this.get('/citizens/rewards'); }
  getLeaderboard() { return this.get('/citizens/leaderboard'); }

  // ─── Zones ───
  listZones() { return this.get('/zones'); }
  createZone(data) { return this.post('/zones', data); }
  getZone(id) { return this.get(`/zones/${id}`); }
  updateZone(id, data) { return this.put(`/zones/${id}`, data); }
  deleteZone(id) { return this.delete(`/zones/${id}`); }
}

const api = new ApiClient();
export default api;
