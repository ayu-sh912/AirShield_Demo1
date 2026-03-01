// ============================================================
// AirShield - Alert Routes
// ============================================================
const express = require('express');
const router  = express.Router();
const { checkAlerts } = require('../controllers/alertController');

// GET /api/alert/check
router.get('/check', checkAlerts);

module.exports = router;
