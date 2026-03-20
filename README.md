# UNIMART

A secure student-to-student marketplace platform for university students to buy and sell items — with OTP-based email verification, real-time chat, and order management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Cache / OTP | Redis |
| Email | SendGrid |
| Auth | JWT + OTP via email |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **PostgreSQL** running on `localhost:5432`
- **Redis** running on `localhost:6379`
- **SendGrid account** with a verified sender email and API key

### Quick way to start PostgreSQL and Redis with Docker

```bash
docker run --name unimart-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker run --name unimart-redis -p 6379:6379 -d redis
```

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in the required values:

```
DATABASE_URL=postgresql://unimart_user:your_password@localhost:5432/UNIMART_LOCAL
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Used only by create_db.py
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=UNIMART_LOCAL
```

### 3. Create the database

```bash
python backend/create_db.py
```

### 4. Run database migrations

```bash
cd backend
alembic upgrade head
cd ..
```

### 5. Sync official student data from `official_data.csv`

The file `backend/official_data.csv` contains the master registry of university students used to verify registrations. Import it into the database with:

```bash
cd backend
python seed_data.py
```

This is non-destructive — if records already exist the command exits without making changes.

### 6. Start the backend server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at **http://localhost:8000**  
Interactive API docs (Swagger UI): **http://localhost:8000/docs**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp frontend/.env.example frontend/.env
```

The default value points at the local backend — change only if your backend runs on a different host/port:

```
VITE_API_URL=http://localhost:8000/api
```

### 3. Start the development server

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:5173**

### 4. Build for production

```bash
cd frontend
npm run build
```

The production bundle is written to `frontend/dist/`.

---

## Running Both Servers Together

Open two terminal windows:

**Terminal 1 — backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

---

## Syncing Official Data (`official_data.csv`)

The file `backend/official_data.csv` is the master registry used to validate student registrations.

**Columns:** `register_no, email, university, college, department, name`

To load or refresh the data after editing the CSV:

```bash
cd backend
python seed_data.py
```

> **Note:** `seed_data.py` only inserts records when the `official_records` table is empty. To re-seed after making changes to the CSV, truncate the table first:
> ```sql
> TRUNCATE TABLE official_records;
> ```
> Then run `python seed_data.py` again.

---

## Project Structure

```
project/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # Database engine and session
│   ├── security.py          # Password hashing, JWT creation
│   ├── dependencies.py      # JWT auth dependency
│   ├── redis_client.py      # Redis connection
│   ├── scheduler.py         # APScheduler (automated cleanup tasks)
│   ├── seed_data.py         # Import official_data.csv into the database
│   ├── create_db.py         # One-time database creation script
│   ├── official_data.csv    # Master student registry (source of truth)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   ├── alembic/             # Database migration scripts
│   └── routers/             # API endpoint groups
│       ├── auth.py          # Registration, login, OTP verification
│       ├── products.py      # Product CRUD and search
│       ├── orders.py        # Order management
│       ├── otp.py           # OTP endpoints
│       ├── chat.py          # Buyer-seller messaging
│       └── admin.py         # Admin operations
│   └── services/
│       ├── email_service.py
│       └── sendgrid_service.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component and layout
│   │   ├── pages/           # Page-level components (11 pages)
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (auth, theme, orders, chat)
│   │   ├── services/        # Axios API integration layer
│   │   ├── routes/          # React Router route definitions
│   │   ├── constants/       # App-wide constants
│   │   └── utils/           # Helper utilities
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (min 32 chars) |
| `SENDGRID_API_KEY` | ✅ | SendGrid API key for OTP emails |
| `SENDGRID_FROM_EMAIL` | ✅ | Verified sender email address |
| `API_HOST` | optional | Server bind host (default `0.0.0.0`) |
| `API_PORT` | optional | Server port (default `8000`) |
| `DB_ADMIN_USER` | create_db only | PostgreSQL admin user |
| `DB_ADMIN_PASSWORD` | create_db only | PostgreSQL admin password |
| `DB_HOST` | create_db only | PostgreSQL host |
| `DB_PORT` | create_db only | PostgreSQL port |
| `DB_NAME` | create_db only | Database name to create |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Full URL of the backend API |
