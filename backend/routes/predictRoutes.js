// ============================================================
// AirShield - Predict Route
// ============================================================
const express = require('express');
const router  = express.Router();
const { getPrediction } = require('../controllers/predictController');

// GET /api/predict
router.get('/', getPrediction);

module.exports = router;
