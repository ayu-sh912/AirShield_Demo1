"""
============================================================
AirShield - ML Prediction Service (Flask + scikit-learn)
Trains a Linear Regression model on MySQL sensor data
and exposes a /predict endpoint.
============================================================
"""

import os
import numpy as np
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import warnings
warnings.filterwarnings('ignore')

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── DB Config ────────────────────────────────────────────────
DB_CONFIG = {
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', 3306)),
    'user':     os.getenv('DB_USER',     'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME',     'airshield_db')
}

MODEL_PATH = 'airshield_model.pkl'

# ── Helpers ──────────────────────────────────────────────────
def classify(pm25):
    """Classify PM2.5 value into Safe / Moderate / Dangerous."""
    if pm25 <= 60:   return 'Safe'
    if pm25 <= 150:  return 'Moderate'
    return 'Dangerous'


def fetch_data():
    """Fetch the last 500 readings from MySQL."""
    conn = mysql.connector.connect(**DB_CONFIG)
    query = """
        SELECT pm25, gas, temperature, humidity, created_at
        FROM sensor_readings
        ORDER BY created_at DESC
        LIMIT 500
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df.iloc[::-1].reset_index(drop=True)  # chronological order


def build_features(df):
    """
    Build feature matrix for prediction.
    Features: gas, temperature, humidity, lag-1 PM2.5, lag-2 PM2.5
    Target  : next PM2.5 value (shifted by 1)
    """
    df = df.copy()
    df['pm25_lag1'] = df['pm25'].shift(1)
    df['pm25_lag2'] = df['pm25'].shift(2)
    df['target']    = df['pm25'].shift(-1)
    df.dropna(inplace=True)

    feature_cols = ['gas', 'temperature', 'humidity', 'pm25_lag1', 'pm25_lag2']
    X = df[feature_cols].values
    y = df['target'].values
    return X, y, df, feature_cols


def train_model():
    """Train Linear Regression model and save to disk."""
    print("📊 Fetching data from MySQL ...")
    df = fetch_data()

    if len(df) < 5:
        print("⚠️  Not enough data to train (need at least 5 rows). Using dummy model.")
        return None, None

    X, y, df_clean, feature_cols = build_features(df)

    model = Pipeline([
        ('scaler', StandardScaler()),
        ('lr',     LinearRegression())
    ])
    model.fit(X, y)

    joblib.dump({'model': model, 'feature_cols': feature_cols}, MODEL_PATH)
    print(f"✅ Model trained on {len(X)} samples. Saved to {MODEL_PATH}")
    return model, feature_cols


def load_or_train():
    """Load model from disk if exists, else train fresh."""
    if os.path.exists(MODEL_PATH):
        pkg = joblib.load(MODEL_PATH)
        print("✅ Loaded existing model from disk.")
        return pkg['model'], pkg['feature_cols']
    return train_model()


def predict_next(model, feature_cols):
    """Use latest DB row to predict the next PM2.5 value."""
    df = fetch_data()
    if len(df) < 3:
        return None, None

    latest  = df.iloc[-1]
    lag1    = df.iloc[-1]['pm25']
    lag2    = df.iloc[-2]['pm25'] if len(df) >= 2 else lag1

    row = {
        'gas':         latest['gas'],
        'temperature': latest['temperature'],
        'humidity':    latest['humidity'],
        'pm25_lag1':   lag1,
        'pm25_lag2':   lag2
    }
    X_pred = np.array([[row[f] for f in feature_cols]])
    predicted = float(round(model.predict(X_pred)[0], 2))
    predicted = max(0.0, predicted)  # PM2.5 cannot be negative
    return predicted, classify(predicted)


# ── Load model at startup ────────────────────────────────────
model, feature_cols = None, None
try:
    model, feature_cols = load_or_train()
except Exception as e:
    print(f"⚠️  Could not load/train model at startup: {e}")


# ── Routes ───────────────────────────────────────────────────
@app.route('/predict', methods=['GET'])
def predict():
    """Return next predicted PM2.5 value."""
    global model, feature_cols

    # Retrain if model not loaded
    if model is None:
        try:
            model, feature_cols = train_model()
        except Exception as e:
            return jsonify({'error': f'Model training failed: {str(e)}'}), 500

    if model is None:
        return jsonify({'error': 'Not enough data to make a prediction.'}), 422

    try:
        predicted_pm25, predicted_status = predict_next(model, feature_cols)
        if predicted_pm25 is None:
            return jsonify({'error': 'Not enough sensor data.'}), 422

        return jsonify({
            'predicted_pm25':   predicted_pm25,
            'predicted_status': predicted_status,
            'unit':             'μg/m³',
            'model':            'LinearRegression',
            'confidence':       'moderate'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def retrain():
    """Force retrain the model with latest data."""
    global model, feature_cols
    try:
        model, feature_cols = train_model()
        if model is None:
            return jsonify({'success': False, 'message': 'Not enough data'}), 422
        return jsonify({'success': True, 'message': 'Model retrained successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':       'OK',
        'service':      'AirShield ML Service',
        'model_loaded': model is not None
    })


# ── Start Server ─────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('ML_PORT', 5000))
    print(f"🤖 AirShield ML Service starting on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
