// ============================================================
// AirShield - Sensor Data Simulator
// Simulates ESP32 nodes sending data to the backend API
// Run: node simulator.js
// ============================================================

const https = require('https');
const http  = require('http');

const API_URL = 'http://localhost:3000/api/sensor/add';

// Simulated sensor nodes at GLA University, Mathura
const NODES = [
  { node_id: 'Node-742X', location: 'Main Terminal',       basePM25: 12,  baseGas: 420 },
  { node_id: 'Node-D71K', location: 'North Sector',        basePM25: 68,  baseGas: 590 },
  { node_id: 'Node-339M', location: 'Old Entrance Route',  basePM25: 18,  baseGas: 438 },
  { node_id: 'Node-205A', location: 'Quarter Station South',basePM25: 10, baseGas: 410 },
  { node_id: 'Node-BETA', location: 'East Highway',        basePM25: 155, baseGas: 900 },
];

// Random fluctuation helper
function fluctuate(base, range) {
  return Math.round((base + (Math.random() * range * 2 - range)) * 10) / 10;
}

// Send one reading for a node
function sendReading(node) {
  const payload = JSON.stringify({
    node_id:     node.node_id,
    pm25:        Math.round(Math.max(0, fluctuate(node.basePM25, node.basePM25 * 0.15)) * 10) / 10,
    gas:         Math.round(Math.max(0, fluctuate(node.baseGas,  node.baseGas  * 0.10)) * 10) / 10,
    temperature: Math.round(fluctuate(29, 3) * 10) / 10,
    humidity:    Math.round(fluctuate(65, 8) * 10) / 10,
  });

  const options = {
    hostname: 'localhost',
    port:     3000,
    path:     '/api/sensor/add',
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log(`[${new Date().toLocaleTimeString()}] ${node.node_id} → PM2.5: ${JSON.parse(payload).pm25} μg/m³ | Status: ${result.air_quality_status}`);
    });
  });

  req.on('error', err => console.error(`Error sending ${node.node_id}:`, err.message));
  req.write(payload);
  req.end();
}

// Send readings for all nodes
function sendAllNodes() {
  console.log(`\n📡 [${new Date().toLocaleTimeString()}] Sending readings for all ${NODES.length} nodes...`);
  NODES.forEach(node => sendReading(node));
}

// Start simulator
console.log('🚀 AirShield Sensor Simulator Started');
console.log(`📍 Simulating ${NODES.length} nodes at GLA University, Mathura`);
console.log('⏱️  Sending data every 5 seconds...\n');
console.log('Press Ctrl+C to stop\n');

sendAllNodes(); // send immediately
setInterval(sendAllNodes, 5000); // then every 5 seconds