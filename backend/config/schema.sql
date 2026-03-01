-- ============================================================
-- AirShield Database Schema
-- Run this ONCE to set up the database
-- ============================================================

-- 1. Create and select database
CREATE DATABASE IF NOT EXISTS airshield_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE airshield_db;

-- 2. Main sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id                 INT          AUTO_INCREMENT PRIMARY KEY,
  node_id            VARCHAR(50)  NOT NULL COMMENT 'Unique sensor node identifier (e.g. Node-742X)',
  pm25               FLOAT        NOT NULL COMMENT 'PM2.5 concentration in μg/m³',
  gas                FLOAT        NOT NULL COMMENT 'Gas/VOC reading from MQ-135 (ppm)',
  temperature        FLOAT        NOT NULL COMMENT 'Temperature in °C',
  humidity           FLOAT        NOT NULL COMMENT 'Relative humidity in %',
  air_quality_status VARCHAR(20)  NOT NULL DEFAULT 'Safe' COMMENT 'Safe | Moderate | Dangerous',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_node_id   (node_id),
  INDEX idx_created   (created_at),
  INDEX idx_status    (air_quality_status)
) ENGINE=InnoDB;

-- 3. Optional: alerts log table
CREATE TABLE IF NOT EXISTS alert_logs (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  node_id     VARCHAR(50)  NOT NULL,
  alert_type  VARCHAR(20)  NOT NULL COMMENT 'CRITICAL | WARNING | PREDICTION',
  pm25        FLOAT,
  message     TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_node   (node_id),
  INDEX idx_type   (alert_type)
) ENGINE=InnoDB;

-- 4. Seed sample data for testing
INSERT INTO sensor_readings (node_id, pm25, gas, temperature, humidity, air_quality_status) VALUES
('Node-742X', 12.4,  421, 28.5, 64, 'Safe'),
('Node-742X', 15.1,  430, 28.9, 63, 'Safe'),
('Node-742X', 22.3,  445, 29.2, 65, 'Safe'),
('Node-D71K', 75.0,  610, 31.0, 70, 'Moderate'),
('Node-D71K', 68.4,  590, 30.8, 69, 'Moderate'),
('Node-339M', 18.5,  438, 27.4, 60, 'Safe'),
('Node-205A',  9.8,  410, 26.8, 58, 'Safe'),
('Node-018',  145.0, 800, 33.2, 75, 'Moderate'),
('Node-BETA', 162.0, 920, 35.0, 80, 'Dangerous'),
('Node-742X', 10.2,  415, 28.1, 62, 'Safe');

SELECT 'AirShield DB setup complete!' AS Status;
