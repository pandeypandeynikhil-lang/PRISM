# PRISM — PowerShell Setup & Run Guide

Complete step-by-step commands to run PRISM on your local Windows machine.

---

## PRE-REQUISITES (install once)

- Python 3.11+  → https://www.python.org/downloads/
- Node.js 20+   → https://nodejs.org/
- Git            → https://git-scm.com/

---

## STEP 1 — Clone / enter the project

```powershell
# If you cloned from GitHub:
git clone https://github.com/YOUR_USERNAME/prism-retention-system.git
cd prism-retention-system

# Or if you already have the folder:
cd prism-retention-system
```

---

## STEP 2 — Backend setup

Open **Terminal 1** (PowerShell):

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install all dependencies
pip install -r requirements.txt

# Create your .env file from the template
Copy-Item .env.example .env
```

Now open `.env` in any text editor and paste your **Gemini API key**:
```
GEMINI_API_KEY=your_actual_key_here
```
Get a free key at: https://aistudio.google.com/app/apikey

---

## STEP 3 — Run the backend

Still in **Terminal 1** (venv must be active — you'll see `(venv)` in the prompt):

```powershell
# Make sure you're in the backend folder with venv active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ You should see:
```
INFO:     PRISM Retention System starting up...
INFO:     All systems initialized
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The ML model trains automatically on first startup (~10 seconds).

---

## STEP 4 — Frontend setup & run

Open **Terminal 2** (a new PowerShell window):

```powershell
# Navigate to frontend folder
cd prism-retention-system\frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

✅ You should see:
```
  VITE v6.x.x  ready in Xms
  ➜  Local:   http://localhost:3000/
```

---

## STEP 5 — Open the app

Open your browser and go to:
```
http://localhost:3000
```

---

## STEP 6 — Seed demo data

Once the app loads, click **"Seed Demo Data"** on the Dashboard to populate 60 synthetic customers with varied risk profiles. The AI features (strategy generation, chat) require your Gemini API key to be set.

---

## API Docs (Swagger UI)

FastAPI auto-generates interactive docs:
```
http://localhost:8000/docs
```

---

## USEFUL COMMANDS

```powershell
# Re-activate backend venv (if you close and reopen Terminal 1)
cd prism-retention-system\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Re-train the ML model manually
cd prism-retention-system\backend
.\venv\Scripts\Activate.ps1
python -m app.ml.train_model

# Install a new Python package
pip install package-name
pip freeze > requirements.txt

# Build frontend for production
cd prism-retention-system\frontend
npm run build
# Output goes to frontend\dist\
```

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| `cannot be loaded because running scripts is disabled` | Run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `ModuleNotFoundError` | Make sure venv is active: `.\venv\Scripts\Activate.ps1` |
| Backend port 8000 already in use | `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| Frontend port 3000 already in use | Edit `vite.config.js` and change `port: 3000` to `3001` |
| Gemini API errors | Verify `GEMINI_API_KEY` in `backend\.env` is correct |
| ChromaDB slow first load | Normal — it downloads `all-MiniLM-L6-v2` model (~90MB) once |

---

## PROJECT PORTS SUMMARY

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:3000 |
| Backend (FastAPI) | http://localhost:8000 |
| API Swagger Docs | http://localhost:8000/docs |
