// ============================================================
// AirShield - Prediction Controller
// ============================================================

const axios = require('axios');
const { getLastNReadings } = require('../models/sensorModel');

async function getPrediction(req, res) {
  try {
    const mlUrl = `${process.env.ML_SERVICE_URL || 'http://localhost:5000'}/predict`;
    const mlRes = await axios.get(mlUrl, { timeout: 8000 });
    return res.json({ success: true, source: 'ml-service', prediction: mlRes.data });
  } catch (err) {
    // Fallback: simple average-based prediction
    try {
      const recentData = await getLastNReadings(10);
      if (!recentData.length) {
        return res.json({ success: true, source: 'fallback', prediction: { predicted_pm25: 0, predicted_status: 'No data yet' }, based_on_readings: 0 });
      }
      const avg = recentData.reduce((sum, r) => sum + Number(r.pm25), 0) / recentData.length;
      const predicted_pm25   = Math.round(avg * 10) / 10;
      const predicted_status = predicted_pm25 <= 60 ? 'Safe' : predicted_pm25 <= 150 ? 'Moderate' : 'Dangerous';
      return res.json({ success: true, source: 'fallback', prediction: { predicted_pm25, predicted_status }, based_on_readings: recentData.length });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Prediction failed' });
    }
  }
}

module.exports = { getPrediction };