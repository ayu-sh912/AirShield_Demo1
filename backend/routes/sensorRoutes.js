// ============================================================
// AirShield - Sensor Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { addReading, getAllReadings, getLatestReadings, getReadingsByNode } = require('../controllers/sensorController');

// POST /api/sensor/add       — Ingest new reading from ESP32
router.post('/add', addReading);

// GET  /api/sensor/all       — Fetch all readings
router.get('/all', getAllReadings);

// GET  /api/sensor/latest    — Latest reading per node
router.get('/latest', getLatestReadings);

// GET  /api/sensor/node/:id  — Readings by node
router.get('/node/:node_id', getReadingsByNode);

module.exports = router;
