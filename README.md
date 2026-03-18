# Unimart

A secure student-to-student marketplace built with **FastAPI** (backend) and **React + Vite** (frontend).

---

## Prerequisites

Make sure the following are installed before running the project:

| Requirement | Version |
|---|---|
| Python | 3.10 + |
| Node.js | 18 + |
| PostgreSQL | 14 + |
| Redis | 6 + |

---

## Project Structure

```
project/
├── backend/          # FastAPI backend
│   ├── official_data.csv   # Official student registry (seed data)
│   ├── requirements.txt
│   └── .env.example        # Environment variable template
└── frontend/         # React + Vite frontend
    └── package.json
```

---

## Backend Setup

### 1. Create and activate a virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, SMTP, and secret values
```

### 4. Run database migrations

```bash
alembic upgrade head
```

### 5. Sync official student data from `official_data.csv`

Run the seed script once to populate the official records table:

```bash
python seed_data.py
```

The script reads `backend/official_data.csv` and inserts records into the `official_records` table. It is **non-destructive** — it skips seeding if records already exist.

### 6. Start the backend server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other frontend commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot-reload) |
| `npm run build` | Build for production (output in `frontend/dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Data Sync – `official_data.csv`

The file `backend/official_data.csv` is the master registry of registered students.  
It must have the following columns:

```
name, register_no, email, university, college, department
```

To re-sync after updating the CSV (e.g., adding new students):

1. Clear existing records from the database (or drop and recreate the table):

   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

2. Re-run the seed script:

   ```bash
   cd backend
   python seed_data.py
   ```

---

## Environment Variables Reference

See `backend/.env.example` for a full list of required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes (default: `30`) |
| `ADMIN_KEY` | Secret key for admin routes |
| `SMTP_SERVER` | SMTP host (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_EMAIL` | Sender email address |
| `SMTP_PASSWORD` | SMTP / App password |

> **Note:** If `SMTP_EMAIL` / `SMTP_PASSWORD` are not set, OTP codes are printed to the console instead of being emailed — useful for local development.
