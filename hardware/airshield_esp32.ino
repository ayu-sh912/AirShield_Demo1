/*
 * ============================================================
 * AirShield – ESP32 Sensor Firmware
 * Sensors: MQ-135 (gas), PM2.5 (analog), DHT11 (temp/humidity)
 * Sends JSON POST to AirShield backend every 10 seconds
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── WiFi Credentials ──────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Backend URL ───────────────────────────────────────────────
const char* SERVER_URL = "http://YOUR_SERVER_IP:3000/api/sensor/add";

// ── Node Identity ─────────────────────────────────────────────
const char* NODE_ID = "Node-742X";

// ── Pin Definitions ───────────────────────────────────────────
#define MQ135_PIN    34     // Analog pin for MQ-135 gas sensor
#define PM25_PIN     35     // Analog pin for PM2.5 sensor
#define DHT_PIN      4      // Digital pin for DHT11
#define DHT_TYPE     DHT11  // Change to DHT22 if using DHT22
#define LED_PIN      2      // Built-in LED for status

// ── Constants ─────────────────────────────────────────────────
#define SEND_INTERVAL_MS   10000   // 10 seconds
#define WIFI_TIMEOUT_MS    15000   // 15 seconds WiFi timeout
#define ADC_RESOLUTION     4095.0  // ESP32 12-bit ADC

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSendTime = 0;

// ── WiFi Connection ───────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT_MS) {
      Serial.println("\n[WiFi] Timeout! Will retry next loop.");
      return;
    }
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
}

// ── Read PM2.5 (convert raw ADC to μg/m³ approx) ─────────────
float readPM25() {
  int raw = analogRead(PM25_PIN);
  // Simple linear conversion (calibrate for your sensor)
  // Typical formula: voltage → dust density
  float voltage  = (raw / ADC_RESOLUTION) * 3.3;
  float pm25_ugm3 = (voltage - 0.9) * 100.0;  // approximate
  return max(0.0f, pm25_ugm3);
}

// ── Read Gas (MQ-135, ppm approximation) ──────────────────────
float readGas() {
  int raw = analogRead(MQ135_PIN);
  // Simple ratio-based conversion; calibrate Rs/Ro for your sensor
  float voltage = (raw / ADC_RESOLUTION) * 3.3;
  float ppm     = (voltage / 3.3) * 1000.0;   // rough scale
  return ppm;
}

// ── Setup ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== AirShield Node Firmware v1.0 ===");

  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  connectWiFi();
}

// ── Main Loop ──────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected. Reconnecting...");
    connectWiFi();
    return;
  }

  // Send data on interval
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    // Read sensors
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    float pm25        = readPM25();
    float gas         = readGas();

    // Validate DHT readings
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[DHT] Failed to read! Skipping send.");
      return;
    }

    Serial.printf("[Sensors] PM2.5=%.2f μg/m³  Gas=%.2f ppm  Temp=%.1f°C  Hum=%.1f%%\n",
                   pm25, gas, temperature, humidity);

    // Build JSON payload
    StaticJsonDocument<256> doc;
    doc["node_id"]     = NODE_ID;
    doc["pm25"]        = round(pm25 * 100) / 100.0;
    doc["gas"]         = round(gas  * 100) / 100.0;
    doc["temperature"] = round(temperature * 10) / 10.0;
    doc["humidity"]    = round(humidity    * 10) / 10.0;

    String payload;
    serializeJson(doc, payload);

    // HTTP POST
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(8000);

    int httpCode = http.POST(payload);

    if (httpCode == 201) {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("[HTTP] ✅ Data sent successfully (201)");
      delay(200);
      digitalWrite(LED_PIN, LOW);
    } else {
      Serial.printf("[HTTP] ❌ Failed. Code: %d  Response: %s\n",
                    httpCode, http.getString().c_str());
    }

    http.end();
  }
}
