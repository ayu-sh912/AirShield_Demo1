/**
 * AirShield Frontend API Connector
 * Connects dashboard/sensor pages to the Node.js backend
 * Usage: import via <script src="/js/api.js"></script>
 */

const API_BASE = window.location.origin; // Same origin as backend

const AirShieldAPI = {

  /**
   * Fetch all sensor readings
   */
  async getAllReadings() {
    const res = await fetch(`${API_BASE}/api/sensor/all`);
    return res.json();
  },

  /**
   * Fetch latest reading per node
   */
  async getLatestReadings() {
    const res = await fetch(`${API_BASE}/api/sensor/latest`);
    return res.json();
  },

  /**
   * Fetch readings for a specific node
   */
  async getNodeReadings(nodeId, limit = 100) {
    const res = await fetch(`${API_BASE}/api/sensor/node/${nodeId}?limit=${limit}`);
    return res.json();
  },

  /**
   * Get ML prediction for next PM2.5 value
   */
  async getPrediction() {
    const res = await fetch(`${API_BASE}/api/predict`);
    return res.json();
  },

  /**
   * Get current alerts
   */
  async getAlerts() {
    const res = await fetch(`${API_BASE}/api/alert/check`);
    return res.json();
  },

  /**
   * Post a new sensor reading (for testing without ESP32)
   */
  async postReading(data) {
    const res = await fetch(`${API_BASE}/api/sensor/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Helper: classify PM2.5 status on frontend
   */
  classify(pm25) {
    if (pm25 <= 60)  return { status: 'Safe',      cls: 'pill-safe', color: '#00ff88' };
    if (pm25 <= 150) return { status: 'Moderate',  cls: 'pill-mod',  color: '#ffc107' };
    return                  { status: 'Dangerous', cls: 'pill-dan',  color: '#ff4757' };
  }
};

// Auto-refresh hook: calls callback every N seconds
function autoRefresh(callback, seconds = 5) {
  callback(); // call immediately
  return setInterval(callback, seconds * 1000);
}

window.AirShieldAPI = AirShieldAPI;
window.autoRefresh  = autoRefresh;
