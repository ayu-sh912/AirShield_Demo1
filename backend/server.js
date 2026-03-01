// ============================================================
// AirShield - Main Express Server
// Author: AirShield Team | GLA University, Mathura
// ============================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const sensorRoutes = require('./routes/sensorRoutes');
const predictRoutes = require('./routes/predictRoutes');
const alertRoutes  = require('./routes/alertRoutes');

// Import DB connection
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/sensor',  sensorRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/alert',   alertRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AirShield Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ── Test DB then Start Server ────────────────────────────────
db.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
    app.listen(PORT, () => {
      console.log(`🚀 AirShield backend running on http://localhost:${PORT}`);
      console.log(`📡 ML Service expected at ${process.env.ML_SERVICE_URL}`);
    });
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('Please check your .env DB credentials and ensure MySQL is running.');
    process.exit(1);
  });
