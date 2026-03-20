# UNIMART - Startup Scripts Guide

## 📁 Available Batch Files

### 1. `start.bat` - Full Featured Launcher
**Recommended for first-time setup**

Features:
- System requirements check (Python, Node.js)
- Service status check (PostgreSQL, Redis)
- Optional git pull
- Starts both backend and frontend in separate windows

**Usage**: Double-click `start.bat`

---

### 2. `start-simple.bat` - Quick Start
**Recommended for daily use**

Features:
- No prompts or checks
- Instantly starts both servers
- Minimal output

**Usage**: Double-click `start-simple.bat`

---

### 3. Individual Server Scripts

#### `start-backend.bat`
Starts only the backend server (FastAPI + Uvicorn)
- Port: 8000
- API Docs: http://localhost:8000/docs

#### `start-frontend.bat`
Starts only the frontend server (Vite + React)
- Port: 5173
- URL: http://localhost:5173

**Usage**: Use these when you want to start servers separately or restart just one server.

---

## 🚀 Quick Start Instructions

### Option 1: Everything at Once
```
Double-click: start-simple.bat
```

### Option 2: Manual Control
```
1. Double-click: start-backend.bat
2. Wait 5 seconds
3. Double-click: start-frontend.bat
```

---

## 📊 Access Points

After starting the servers:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **User Login** | http://localhost:5173/login |
| **Admin Panel** | http://localhost:5173/admin/login |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/docs |

---

## 🔑 Admin Credentials

- **Username**: `admin123`
- **Password**: `admin@2007`

---

## ⚠️ Prerequisites

Before running any batch file, ensure:

1. **PostgreSQL** is running on port 5432
2. **Redis** is running on port 6379
3. **Python** is installed and in PATH
4. **Node.js** is installed and in PATH

---

## 🐛 Troubleshooting

### "Python is not recognized"
- Install Python from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation

### "Node is not recognized"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "Port already in use"
- Check if servers are already running
- Kill existing processes:
  ```bash
  # Kill backend
  taskkill /F /IM python.exe

  # Kill frontend
  taskkill /F /IM node.exe
  ```

### Backend fails to start
- Check PostgreSQL is running
- Check Redis is running
- Verify `.env` file exists in `backend/` folder

### Frontend fails to start
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run: `npm install`

---

## 🔄 Stopping the Servers

Simply close the terminal windows that opened, or press `Ctrl+C` in each window.

---

## 📝 Notes

- First run may take longer (installing dependencies)
- Backend must start before frontend for full functionality
- Keep terminal windows open while using the application
- Changes to code auto-reload (hot module replacement)
