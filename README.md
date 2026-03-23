# SmartWaste Pro — AI-Powered Smart Waste Management System

> Next-generation IoT-powered waste management platform for smart cities. Real-time bin monitoring, AI route optimization, predictive analytics, and citizen engagement — all in one dashboard.

## 🏗️ Architecture

```
frontend/   → Next.js 16.0.10 (React Dashboard + Citizen Portal)
backend/    → FastAPI + Motor (Async MongoDB) + JWT Auth
database    → MongoDB Atlas (Cloud)
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and set your MongoDB Atlas connection string

# Seed database with demo data
python seed.py

# Start backend server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Open in Browser

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Demo Accounts

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@smartwaste.pro       | admin123     |
| Operator | operator@smartwaste.pro    | operator123  |
| Citizen  | citizen@smartwaste.pro     | citizen123   |

## ✨ Features

### 📊 Admin Dashboard
- Real-time KPI monitoring (bins, alerts, fill levels, fleet)
- Zone performance rankings
- Waste composition analysis
- Environmental impact tracker (CO₂ saved, trees equivalent)

### 🗑️ Smart Bin Management
- IoT sensor data: fill level, temperature, humidity, methane, battery
- Grid & table views with zone/status/type filters
- Auto-status detection (full when >90%)

### 🗺️ AI Route Optimization
- Greedy nearest-neighbor algorithm with urgency weighting
- Selects bins ≥60% fill for collection
- Estimates distance, duration, and waypoint order

### 📈 Predictive Analytics
- Fill level predictions (time-to-full estimation)
- Historical collection trends (30-day bar chart)
- Zone efficiency scoring

### 🚛 Fleet Management
- Vehicle CRUD with driver assignment
- Fuel level monitoring
- Collection history tracking

### 🚨 Alert Center
- Multi-type alerts: overflow, battery, methane, temperature, offline
- Priority-based sorting (Critical → Low)
- Acknowledge / Resolve / Dismiss actions

### 🏘️ Citizen Portal
- Submit issue reports (overflow, illegal dump, damaged bin)
- Schedule waste pickups
- Gamified rewards (points, levels, badges)
- Eco leaderboard

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | Next.js 16.0.10, React 19, CSS Modules |
| Backend   | FastAPI 0.115, Uvicorn, Python 3.12 |
| Database  | MongoDB Atlas (Motor async driver) |
| Auth      | JWT (python-jose + passlib/bcrypt) |
| Styling   | Custom CSS Design System (Dark Theme) |

## 📁 Directory Structure

```
SWM/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── dashboard/    # All dashboard pages
│   │   │   ├── portal/       # Citizen portal
│   │   │   ├── login/        # Auth
│   │   │   └── register/
│   │   ├── components/       # Reusable components
│   │   │   └── layout/       # Sidebar, Header
│   │   └── lib/              # API client, utilities
│   ├── .env.local
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/routes/       # API endpoints
│   │   ├── models/           # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── core/             # Config, DB, Auth
│   ├── main.py
│   ├── seed.py
│   ├── .env
│   └── requirements.txt
└── README.md
```

## ⚙️ Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/swm_db
DATABASE_NAME=swm_db
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📄 License

MIT — Built for Hackathon 2026
