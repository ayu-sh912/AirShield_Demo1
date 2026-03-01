# ⬡ AirShield — Micro-Level Pollution Prediction & Alert System

> B.Tech Second Year Project | GLA University, Mathura  
> Department of Computer Engineering & Applications  
> Supervisor: Dr. Sayantan Sinha | Batch 2025–26

---

## 📌 Team Members

| Name            | Roll No.    |
|-----------------|-------------|
| Nitin Kumar     | 2415001055  |
| Ayush Agrawal   | 2415000394  |
| Shinjinee Dheer | 2415001479  |
| Saurabh Singh   | 2415001449  |
| Vishesh Pandey  | 2415001795  |

---

## 🎯 Project Overview

AirShield is a full-stack IoT + Machine Learning based air pollution monitoring system that:

- Collects **real-time sensor data** from ESP32 nodes (PM2.5, Gas, Temperature, Humidity)
- Stores readings in a **MySQL database**
- Predicts **next PM2.5 values** using a Linear Regression ML model (Python/Flask)
- Visualizes data on a **dark futuristic web dashboard** with charts, alerts, and live sensor streams
- Classifies air quality as **Safe / Moderate / Dangerous**
- Generates **threshold-based and ML-based alerts**

---

## 🗂️ Folder Structure

```
AirShield/
├── backend/                   ← Node.js + Express REST API
│   ├── config/
│   │   ├── db.js              ← MySQL pool connection
│   │   └── schema.sql         ← Database setup script
│   ├── controllers/
│   │   ├── sensorController.js
│   │   ├── predictController.js
│   │   └── alertController.js
│   ├── models/
│   │   └── sensorModel.js
│   ├── routes/
│   │   ├── sensorRoutes.js
│   │   ├── predictRoutes.js
│   │   └── alertRoutes.js
│   ├── .env                   ← Environment config
│   ├── package.json
│   └── server.js              ← Entry point
│
├── frontend/                  ← HTML/CSS/JS Web Dashboard
│   ├── index.html             ← Landing Page
│   ├── dashboard.html         ← Main Dashboard
│   ├── sensor.html            ← Sensor Detail Page
│   └── js/
│       └── api.js             ← API connector
│
├── ml-service/                ← Python Flask ML Service
│   ├── app.py                 ← Flask app + Linear Regression
│   ├── requirements.txt
│   └── .env
│
├── hardware/
│   └── airshield_esp32.ino   ← ESP32 Arduino firmware
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Hardware  | ESP32, MQ-135, PM2.5 sensor, DHT11     |
| Firmware  | Arduino IDE, ArduinoJson, WiFi          |
| Backend   | Node.js, Express.js, MySQL2, CORS       |
| Database  | MySQL 8.x                               |
| ML        | Python 3.10+, Flask, scikit-learn       |
| Frontend  | HTML5, CSS3, Vanilla JS, Chart.js       |

---

## ⚡ Quick Start

### 1. MySQL Setup

```bash
# Login to MySQL
mysql -u root -p

# Run schema
SOURCE /path/to/AirShield/backend/config/schema.sql;
```

### 2. Backend Setup

```bash
cd backend
npm install

# Edit .env with your DB credentials
cp .env .env.local
nano .env

npm start
# → Server running at http://localhost:3000
```

### 3. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt

# Edit .env with your DB credentials
python app.py
# → ML service running at http://localhost:5000
```

### 4. Frontend

Open `frontend/index.html` in your browser, **or** visit `http://localhost:3000` (served by Node.js automatically).

### 5. ESP32

1. Open `hardware/airshield_esp32.ino` in Arduino IDE
2. Install libraries: **ArduinoJson**, **DHT sensor library**, **WiFi** (ESP32 board package)
3. Set your `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_URL`
4. Flash to ESP32

---

## 🔌 API Reference

| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/sensor/add`             | Add new sensor reading             |
| GET    | `/api/sensor/all`             | Get all readings (last 200)        |
| GET    | `/api/sensor/latest`          | Latest reading per node            |
| GET    | `/api/sensor/node/:id`        | Readings by node ID                |
| GET    | `/api/predict`                | ML prediction for next PM2.5       |
| GET    | `/api/alert/check`            | Get active threshold/ML alerts     |
| GET    | `/api/health`                 | Backend health check               |
| GET    | `/predict` *(ML service)*     | Raw ML prediction endpoint         |
| POST   | `/train`   *(ML service)*     | Force retrain model                |

### Example: POST `/api/sensor/add`

```json
{
  "node_id":     "Node-742X",
  "pm25":        12.4,
  "gas":         421.0,
  "temperature": 28.5,
  "humidity":    64.0
}
```

Response:
```json
{
  "success": true,
  "id": 42,
  "air_quality_status": "Safe"
}
```

---

## 🧠 Air Quality Classification

| PM2.5 (μg/m³) | Status    | Color  |
|---------------|-----------|--------|
| 0 – 60        | Safe      | 🟢 Green  |
| 61 – 150      | Moderate  | 🟡 Yellow |
| > 150         | Dangerous | 🔴 Red    |

---

## 🌐 Deployment (Render / Railway)

### Backend on Render

1. Push project to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory**: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`

### ML Service on Render

1. Create another **Web Service**
2. Root directory: `ml-service`
3. Build: `pip install -r requirements.txt`
4. Start: `python app.py`

### MySQL on Railway

1. Create a MySQL plugin on [railway.app](https://railway.app)
2. Copy connection string into backend `.env`

---

## 🔧 Environment Variables

### Backend `.env`

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airshield_db
ML_SERVICE_URL=http://localhost:5000
PM25_MODERATE=60
PM25_DANGEROUS=150
```

### ML Service `.env`

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airshield_db
ML_PORT=5000
```

---

## 📊 Dashboard Pages

| Page              | File                 | Description                              |
|-------------------|----------------------|------------------------------------------|
| Landing Page      | `frontend/index.html`     | Animated globe hero, features, CTA  |
| Dashboard         | `frontend/dashboard.html` | Map, charts, alerts, live stream    |
| Sensor Detail     | `frontend/sensor.html`    | Node health, gauges, 7-day analytics|

---

## 📚 References

1. Banciu et al., "Monitoring and predicting air quality with IoT devices," *Processes*, 2024.
2. Gryech et al., "Applications of ML and IoT for outdoor air pollution," *arXiv*, 2024.
3. Saini et al., "Indoor air quality monitoring systems based on IoT," *Int. J. Environ. Research*, 2020.

---

*AirShield — Breathe Smarter 🌍*
