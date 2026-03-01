// ============================================================
// AirShield - Sensor Controller
// ============================================================

const SensorModel = require('../models/sensorModel');

// POST /api/sensor/add
// Body: { node_id, pm25, gas, temperature, humidity }
async function addReading(req, res) {
  try {
    const { node_id, pm25, gas, temperature, humidity } = req.body;

    // Validate required fields
    if (!node_id || pm25 === undefined || gas === undefined || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields: node_id, pm25, gas, temperature, humidity' });
    }

    const result = await SensorModel.insertReading({ node_id, pm25, gas, temperature, humidity });

    return res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      id: result.id,
      air_quality_status: result.air_quality_status
    });
  } catch (err) {
    console.error('addReading error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/sensor/all
async function getAllReadings(req, res) {
  try {
    const data = await SensorModel.getAllReadings();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('getAllReadings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/sensor/latest
async function getLatestReadings(req, res) {
  try {
    const data = await SensorModel.getLatestReadings();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('getLatestReadings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/sensor/node/:node_id
async function getReadingsByNode(req, res) {
  try {
    const { node_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const data = await SensorModel.getReadingsByNode(node_id, limit);
    return res.json({ success: true, node_id, count: data.length, data });
  } catch (err) {
    console.error('getReadingsByNode error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { addReading, getAllReadings, getLatestReadings, getReadingsByNode };
