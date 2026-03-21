<div align="center">

# UNIMART

### The Secure Student-to-Student Marketplace

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*A closed-ecosystem marketplace exclusively for verified university students.*
*Buy, sell, and trade safely — zero scams, zero outsiders.*

[Live Demo](https://project-pi-swart.vercel.app) · [Report Bug](https://github.com/numankhan2007/project/issues) · [Request Feature](https://github.com/numankhan2007/project/issues)

</div>

---

## Table of Contents

- [About UNIMART](#-about-unimart)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Security Architecture](#-security-architecture)
- [Admin Module](#-admin-module)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## About UNIMART

UNIMART is a **closed-ecosystem marketplace** built exclusively for university students. Unlike general platforms such as OLX or Facebook Marketplace, every user on UNIMART is cryptographically tied to an **official university registry** — meaning every buyer and every seller is a verified peer from your campus.

The platform eliminates the two biggest problems in student second-hand trading:

| Problem | UNIMART Solution |
|---|---|
| Scammers pretending to be students | Official university registry verification on signup |
| Item disputes after payment | Physical OTP handshake — buyer confirms before transaction completes |
| Anonymous sellers | Every profile linked to a real register number |
| Post-sale ghosting | In-platform chat tied to active orders only |

---

## Core Features

### Multi-Phase Registration
Students cannot register unless their register number exists in the **Official Master Registry** (`official_records` table). Registration flow:
1. Enter register number → system validates against registry
2. OTP sent to **official university email** (not personal email)
3. Email verified → student fills personal credentials
4. Account created → JWT issued

### OTP Delivery Handshake
Every physical transaction uses a secure handshake mechanism:
1. Buyer creates order → status: `PENDING`
2. Seller confirms → status: `CONFIRMED`
3. Seller initiates delivery → Redis OTP generated, emailed to buyer
4. Physical meetup: buyer inspects item, hands OTP to seller
5. Seller enters OTP → order status: `COMPLETED`, product: `SOLD_OUT`

No OTP = no completion. Buyer always has control.

### Order-Scoped Chat
Chat is only available between buyer and seller **within an active order**. No cold messaging. No spam. Every message is tied to an `order_id`.

### Admin Control Panel
Separate admin module with its own JWT, audit trail, and full management capabilities:
- User management (suspend, reinstate, delete)
- Product moderation (flag, remove, override status)
- Order oversight (override status with mandatory reason)
- Full audit log of every admin action

### Landing Page
- Rainbow tube cursor (WebGL, Three.js-powered)
- RGB cycling gradient animation on UNIMART title
- Pitch-black background for maximum contrast
- Fully responsive across all screen sizes

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 4+ | Build tool & dev server |
| TailwindCSS | 3 | Utility-first styling |
| Framer Motion | Latest | UI animations |
| React Router DOM | 6 | Client-side routing |
| Axios | Latest | HTTP client with interceptors |
| Three.js | Latest | WebGL tube cursor effect |
| Lucide React | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.100+ | Async Python API framework |
| SQLAlchemy | 2.0 | ORM |
| Alembic | Latest | Database migrations |
| Pydantic | v2 | Request/response validation |
| PyJWT | Latest | JWT token generation |
| passlib[bcrypt] | Latest | Password hashing |
| APScheduler | Latest | Background task scheduling |
| Redis (aioredis) | Latest | OTP storage with TTL |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL 14+ | Primary relational database |
| Redis 7+ | OTP storage, rate limiting counters |
| SMTP (smtplib) | Email delivery for OTPs |
| Vercel | Frontend deployment |
| Alembic | Database migration management |

---

## Project Structure

```
unimart/
├── backend/
│   ├── routers/
│   │   ├── auth.py          # Registration, login, JWT
│   │   ├── products.py      # Product CRUD, search
│   │   ├── orders.py        # Order lifecycle management
│   │   ├── otp.py           # OTP generation & verification
│   │   └── admin.py         # Admin endpoints
│   ├── services/
│   │   └── email_service.py # Async SMTP email dispatch
│   ├── admin_models.py      # AdminAccount, AuditLog tables
│   ├── admin_auth.py        # Admin JWT (separate from student JWT)
│   ├── admin_router.py      # 20 admin endpoints
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── database.py          # PostgreSQL connection & session
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (not committed)
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Landing page (tube cursor, RGB title)
│   │   │   ├── Login.jsx       # Student login
│   │   │   ├── Register.jsx    # Multi-step registration
│   │   │   ├── Dashboard.jsx   # Product marketplace
│   │   │   ├── ProductPage.jsx # Single product view
│   │   │   ├── Orders.jsx      # Order management
│   │   │   └── ChatPage.jsx    # Order-scoped messaging
│   │   ├── components/
│   │   │   ├── TubesCursor.js  # WebGL rainbow cursor (landing only)
│   │   │   └── ...             # Shared UI components
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # JWT auth state
│   │   │   ├── ThemeContext.jsx # Dark/light theme
│   │   │   └── OrderContext.jsx # Order state
│   │   ├── services/
│   │   │   └── api.js          # Axios instance with interceptors
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx   # Route definitions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── landing.css         # Landing page animations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 7+

### 1. Clone the repository
```bash
git clone https://github.com/numankhan2007/project.git
cd project
```

### 2. Backend setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Mac/Linux
# OR: venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Backend ReDoc: http://localhost:8000/redoc

---

## Environment Variables

### Backend `.env`
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/unimart

# Redis
REDIS_URL=redis://localhost:6379

# JWT (student tokens)
JWT_SECRET_KEY=your_super_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Refresh token
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Admin JWT (separate from student JWT)
ADMIN_JWT_SECRET=your_admin_secret_here
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=your_strong_admin_password

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=noreply@unimart.edu
```

### Frontend `.env.local`
```env
VITE_API_BASE_URL=http://localhost:8000
```

> **Never commit `.env` files.** They are in `.gitignore`.

---

## API Documentation

The full interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoint Groups

| Group | Base Path | Description |
|---|---|---|
| Auth | `/auth` | Register, login, refresh token |
| OTP | `/otp` | Send and verify OTPs |
| Products | `/products` | CRUD, search, categorize |
| Orders | `/orders` | Create, confirm, deliver, complete |
| Chat | `/chat` | Order-scoped messaging |
| Admin | `/admin` | Full admin management suite |

---

## Security Architecture

### Student Authentication
- **JWT Bearer tokens** — stateless, 30-minute expiry
- **Refresh tokens** — 7-day expiry, separate secret
- **bcrypt** password hashing (cost factor 12)
- **Register number binding** — every JWT is tied to a register number

### Admin Authentication
- **Completely separate JWT** with `token_type: "admin"` claim
- Admin tokens use a **different secret** than student tokens
- Student tokens cannot access admin endpoints (token type guard)
- Every admin action is recorded in `admin_audit_logs`

### OTP Security
- Generated using `secrets.randbelow` (cryptographically secure)
- **Never stored in PostgreSQL** — Redis only with 600-second TTL
- **Brute-force protection** — invalidated after 5 failed attempts
- Delivered to **official university email only** (not personal email)

### Rate Limiting
- Auth endpoints: 10 requests / 60 seconds
- Admin login: 5 requests / 300 seconds
- Standard endpoints: 60 requests / 60 seconds

---

## Admin Module

UNIMART includes a full-featured admin control panel accessible at `/admin`.

### Features
- **Dashboard** — live stats (users, products, orders, weekly growth)
- **User Management** — view, edit, suspend, reinstate, soft-delete
- **Product Moderation** — flag, status override, hard delete
- **Order Oversight** — override status with mandatory reason logging
- **Audit Logs** — complete trail of every admin action with IP address

### Admin Setup
The super-admin account is seeded automatically on first startup using
`ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`. Credentials are hashed
with bcrypt — **never stored as plaintext**.

---

## Deployment

### Frontend (Vercel)
```bash
# Build for production
cd frontend && npm run build

# Deploy (automatic on push to main if connected to Vercel)
git push origin main
```

Vercel environment variables to set:
```
VITE_API_BASE_URL = https://your-backend-domain.com
```

### Backend
Deploy to any Python-compatible host (Railway, Render, DigitalOcean, AWS EC2).

```bash
# Production start command
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Ensure these are configured in production:
- PostgreSQL connection string
- Redis connection string
- All JWT secrets (strong, random, minimum 64 characters)
- SMTP credentials

---

## Contributing

This is a university project. Contributions from verified students are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Commit Convention
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, no logic change
refactor: code restructure
chore:    maintenance tasks
```

---

## License

This project is licensed under the MIT License.

---

<div align="center">

**Built with love for university students**

*UNIMART — Where campus commerce is safe, verified, and seamless.*

</div>
