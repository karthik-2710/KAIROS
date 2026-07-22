# 🌿 KAIROS
## Knowledge-driven Agricultural Intelligence for Real-time Optimization and Sustainability

> **"The Right Data. The Right Time. The Right Decision."**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-38B2AC.svg)](https://tailwindcss.com/)

---

## 🚀 Overview

KAIROS is an AI-powered **Precision Agriculture Decision Support System** that combines:

| Source | Technology |
|--------|-----------|
| 🛰️ Satellite Imagery | Sentinel-2 + NDVI Processing |
| 📡 IoT Sensors | ESP32 + DHT11 + Soil/Rain sensors |
| 🌦️ Weather | OpenWeatherMap API |
| 🤖 AI Disease Detection | TensorFlow + MobileNetV3 + PlantVillage |
| 🧠 Recommendation Engine | Multi-source cross-verification |

---

## 📁 Project Structure

```
KAIROS/
├── frontend/          # React + Vite + Tailwind SaaS Dashboard
├── backend/           # Flask REST API + AI + Recommendation Engine
├── hardware/          # ESP32 Arduino Firmware
├── docs/              # API Docs + Architecture Guide
└── README.md
```

---

## ⚡ Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python run.py
```

### Environment Variables

Create a root `.env` file based on `.env.example`:

| Variable | Description |
|-----------|-------------|
| SENTINEL_HUB_CLIENT_ID | Sentinel Hub OAuth Client ID |
| SENTINEL_HUB_CLIENT_SECRET | Sentinel Hub OAuth Client Secret |
| SENTINEL_HUB_INSTANCE_ID | Sentinel Hub Instance ID |
| SENTINEL_CLIENT_ID | Sentinel Client ID |
| SENTINEL_CLIENT_SECRET | Sentinel Client Secret |
| OPENWEATHER_API_KEY | Weather API Key |
| SECRET_KEY | Flask JWT Secret |
| DATABASE_PATH | SQLite Database Path |
| MODEL_PATH | Path to AI Model |
| MODEL_CLASSES_PATH | Path to AI Model Classes |
| UPLOAD_FOLDER | Uploads directory |
| CORS_ORIGINS | Allowed CORS origins |
| VITE_API_BASE_URL | Frontend API Base URL |

---

## 🔌 Hardware Setup

Flash `hardware/esp32_firmware.ino` to your ESP32.

Wire:
- DHT11 → GPIO 4
- Soil Moisture → GPIO 34 (Analog)
- Rain Sensor → GPIO 35 (Analog)

Update `KAIROS_SERVER_URL` in firmware to your backend URL.

---

## 🧠 AI Model Setup

```bash
cd backend
python -m app.ai.train_model
```

Uses PlantVillage dataset. See `docs/AI_SETUP.md` for full instructions.

---

## 📡 API Documentation

See `docs/API.md` for full endpoint documentation.

---

## 🏆 Built for Smart India Hackathon (SIH)

KAIROS demonstrates real-world applicability of AI + Satellite + IoT convergence for sustainable agriculture.

---

## 📄 License

MIT License
"# kairos-agri-project" 
