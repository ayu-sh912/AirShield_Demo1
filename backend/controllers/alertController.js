// ============================================================
// AirShield - Alert Controller
// Generates threshold-based and prediction-based alerts
// ============================================================

const { getLatestReadings } = require('../models/sensorModel');
const axios = require('axios');

const PM25_MODERATE  = Number(process.env.PM25_MODERATE)  || 60;
const PM25_DANGEROUS = Number(process.env.PM25_DANGEROUS) || 150;

// GET /api/alert/check
async function checkAlerts(req, res) {
  try {
    const readings = await getLatestReadings();
    const alerts = [];

    readings.forEach(r => {
      const pm25 = Number(r.pm25);

      if (pm25 > PM25_DANGEROUS) {
        alerts.push({
          type: 'CRITICAL',
          node_id: r.node_id,
          message: `Node ${r.node_id} reporting critical PM2.5: ${pm25} μg/m³. Immediate action required.`,
          pm25,
          timestamp: r.created_at
        });
      } else if (pm25 > PM25_MODERATE) {
        alerts.push({
          type: 'WARNING',
          node_id: r.node_id,
          message: `Node ${r.node_id} PM2.5 is elevated: ${pm25} μg/m³. Monitor closely.`,
          pm25,
          timestamp: r.created_at
        });
      }
    });

    // Try to include ML-based prediction alert
    try {
      const mlRes = await axios.get(`${process.env.ML_SERVICE_URL || 'http://localhost:5000'}/predict`, { timeout: 4000 });
      const pred = mlRes.data;
      if (pred.predicted_pm25 > PM25_MODERATE) {
        alerts.push({
          type: 'PREDICTION',
          node_id: 'ML-ENGINE',
          message: `ML model forecasts PM2.5 of ${pred.predicted_pm25} μg/m³ — Status: ${pred.predicted_status}`,
          pm25: pred.predicted_pm25,
          timestamp: new Date().toISOString()
        });
      }
    } catch (_) { /* ML service optional */ }

    return res.json({ success: true, alert_count: alerts.length, alerts });
  } catch (err) {
    console.error('checkAlerts error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { checkAlerts };
