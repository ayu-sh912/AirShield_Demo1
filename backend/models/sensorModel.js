// ============================================================
// AirShield - Sensor Model (MySQL queries)
// ============================================================

const db = require('../config/db');

function classifyAirQuality(pm25) {
  if (pm25 <= 60)  return 'Safe';
  if (pm25 <= 150) return 'Moderate';
  return 'Dangerous';
}

async function insertReading(data) {
  const { node_id, pm25, gas, temperature, humidity } = data;

  // Round all values to 1 decimal place
  const r_pm25        = Math.round(Number(pm25)        * 10) / 10;
  const r_gas         = Math.round(Number(gas)         * 10) / 10;
  const r_temperature = Math.round(Number(temperature) * 10) / 10;
  const r_humidity    = Math.round(Number(humidity)    * 10) / 10;

  const air_quality_status = classifyAirQuality(r_pm25);

  const sql = `INSERT INTO sensor_readings (node_id, pm25, gas, temperature, humidity, air_quality_status) VALUES (?, ?, ?, ?, ?, ?)`;
  const [result] = await db.execute(sql, [node_id, r_pm25, r_gas, r_temperature, r_humidity, air_quality_status]);
  return { id: result.insertId, air_quality_status };
}

async function getAllReadings() {
  const [rows] = await db.execute('SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 200');
  return rows;
}

async function getLatestReadings() {
  const [rows] = await db.execute(`
    SELECT r.* FROM sensor_readings r
    INNER JOIN (
      SELECT node_id, MAX(created_at) AS max_ts FROM sensor_readings GROUP BY node_id
    ) latest ON r.node_id = latest.node_id AND r.created_at = latest.max_ts
    ORDER BY r.node_id
  `);
  return rows;
}

async function getLastNReadings(n) {
  const limit = parseInt(n, 10) || 50;
  const [rows] = await db.execute('SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT ' + limit);
  return rows.reverse();
}

async function getReadingsByNode(node_id, limit = 100) {
  const [rows] = await db.execute(
    'SELECT * FROM sensor_readings WHERE node_id = ? ORDER BY created_at DESC LIMIT ?',
    [node_id, parseInt(limit, 10)]
  );
  return rows;
}

module.exports = { insertReading, getAllReadings, getLatestReadings, getLastNReadings, getReadingsByNode, classifyAirQuality };