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
- [Database Schema](#-database-schema)
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
4. Account created → JWT + Refresh token issued (7-day expiry)

### Multi-Image Product Upload
Products support multiple images with advanced features:
1. **Cloudinary integration** — images stored in cloud with CDN delivery
2. **Image cropper** — built-in crop tool before upload
3. **Position ordering** — images displayed in specified order
4. **Validation** — max file size (10MB), allowed formats (JPEG, PNG, WEBP)
5. **Optimized storage** — `ProductImage` table with cascade deletes

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
- **Dashboard** — Real-time statistics with 7-day growth trends
- **User management** — Suspend, reinstate, soft-delete with mandatory reasons
- **Product moderation** — Flag products, override status, hard delete
- **Order oversight** — Override order status with mandatory reason logging
- **Audit logs** — Complete trail of every admin action with IP address and timestamp
- **Separate authentication** — Admin JWT uses different secret than student tokens

### Background Task Automation
APScheduler runs automated cleanup tasks:
- **Product cleanup** — Auto-delete SOLD_OUT products after 7 days
- **Chat expiry** — Remove chat messages from completed orders after 24 hours
- **Health checks** — Scheduler lifespan tied to FastAPI app lifecycle

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
| React | 18.3 | UI framework |
| Vite | 5.4+ | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| Framer Motion | 11.2+ | UI animations & transitions |
| React Router DOM | 6.23+ | Client-side routing |
| Axios | 1.7+ | HTTP client with interceptors |
| Three.js | 0.183+ | WebGL tube cursor effect |
| Lucide React | 0.395+ | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.134+ | Async Python API framework |
| SQLAlchemy | 2.0 | ORM with connection pooling |
| Alembic | 1.13+ | Database migrations |
| Pydantic | v2 | Request/response validation |
| PyJWT | 2.8+ | JWT token generation (student + admin) |
| passlib[bcrypt] | 1.7+ | Password hashing (bcrypt) |
| APScheduler | 3.10+ | Background task scheduling |
| Redis | 5.0+ | OTP storage, rate limiting |
| Cloudinary | 1.36+ | Image upload and storage |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL 14+ | Primary relational database with connection pooling |
| Redis 7+ | OTP storage (10-min TTL), rate limiting counters |
| SMTP (smtplib) | Email delivery for OTPs and notifications |
| Cloudinary | Image hosting and CDN |
| Vercel | Frontend deployment |

---

## Project Structure

```
unimart/
├── backend/
│   ├── routers/
│   │   ├── auth.py          # Registration, login, JWT, OTP verification
│   │   ├── products.py      # Product CRUD, search, filtering
│   │   ├── orders.py        # Order lifecycle management
│   │   ├── otp.py           # OTP generation & verification
│   │   ├── chat.py          # Order-scoped messaging
│   │   ├── admin.py         # Admin endpoints (20+ endpoints)
│   │   └── upload.py        # Cloudinary image upload
│   ├── services/
│   │   └── email_service.py # Async SMTP email dispatch
│   ├── middleware/
│   │   └── rate_limit.py    # Redis-based rate limiting
│   ├── alembic/
│   │   ├── versions/        # Migration files
│   │   ├── env.py           # Migration environment
│   │   └── README           # Alembic documentation
│   ├── admin_models.py      # AdminAccount, AdminAuditLog tables
│   ├── admin_auth.py        # Separate admin JWT authentication
│   ├── admin_schemas.py     # Admin Pydantic schemas
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── database.py          # PostgreSQL connection & session
│   ├── dependencies.py      # FastAPI dependencies
│   ├── security.py          # JWT creation, bcrypt hashing
│   ├── redis_client.py      # Redis connection & health checks
│   ├── scheduler.py         # APScheduler background tasks
│   ├── seed_data.py         # Database seeding from CSV
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   ├── alembic.ini          # Alembic configuration
│   └── official_data.csv    # University registry seed data
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Landing page (tube cursor, RGB title)
│   │   │   ├── Login.jsx       # Student login
│   │   │   ├── Register.jsx    # Multi-step registration + OTP
│   │   │   ├── Home.jsx        # Product marketplace
│   │   │   ├── Dashboard.jsx   # User dashboard
│   │   │   ├── ProductPage.jsx # Single product view
│   │   │   ├── SellProduct.jsx # Product listing with multi-image upload
│   │   │   ├── Orders.jsx      # Order management
│   │   │   ├── ChatPage.jsx    # Order-scoped messaging
│   │   │   ├── AboutUs.jsx     # About page
│   │   │   ├── HelpCenter.jsx  # Help page
│   │   │   ├── TermsAndConditions.jsx
│   │   │   └── NotFound.jsx    # 404 page
│   │   ├── admin/
│   │   │   ├── pages/
│   │   │   │   ├── AdminLoginPage.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── Products.jsx
│   │   │   │   ├── Orders.jsx
│   │   │   │   └── AuditLogs.jsx
│   │   │   ├── components/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminTable.jsx
│   │   │   │   ├── AdminProtectedRoute.jsx
│   │   │   │   └── AdminToast.jsx
│   │   │   └── services/
│   │   │       └── adminApi.js
│   │   ├── components/
│   │   │   ├── common/        # Badge, Button, Input, Modal, Toast
│   │   │   ├── chat/          # ChatBox, ChatInput, MessageBubble
│   │   │   ├── dashboard/     # BuyHistory, SellHistory, ProfileDropdown
│   │   │   ├── layout/        # Navbar, Footer, ProtectedRoute
│   │   │   ├── order/         # OrderModal, OTPModal, OrderStatusBadge
│   │   │   ├── product/       # ProductCard, ProductGrid, ProductFilters
│   │   │   ├── TubesCursor.js # WebGL rainbow cursor (Three.js)
│   │   │   ├── ImageCropper.jsx # Advanced image cropping
│   │   │   └── ThemeToggle.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # User authentication state
│   │   │   ├── AdminAuthContext.jsx  # Admin authentication state
│   │   │   ├── ChatContext.jsx       # Chat state
│   │   │   ├── OrderContext.jsx      # Order state
│   │   │   ├── ThemeContext.jsx      # Theme persistence
│   │   │   └── NotificationContext.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance with interceptors
│   │   │   ├── authService.js   # Auth API calls
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   ├── chatService.js
│   │   │   └── otpService.js
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx    # Route definitions
│   │   ├── hooks/
│   │   │   └── useBackNavigation.js
│   │   ├── constants/
│   │   │   ├── index.js
│   │   │   └── universities.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── landing.css         # Landing page animations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── start.bat                # Complete system launcher with health checks
├── start-backend.bat        # Backend-only launcher
├── start-frontend.bat       # Frontend-only launcher
├── start-simple.bat         # Simplified launcher
├── run_commands.txt         # Command reference guide
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
JWT_SECRET_KEY=your_super_secret_key_here_minimum_64_characters_recommended
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Refresh token (7-day expiry)
REFRESH_TOKEN_SECRET=your_refresh_secret_here_different_from_jwt_secret
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin JWT (separate from student JWT)
ADMIN_JWT_SECRET=your_admin_secret_here_different_from_student_secret

# Admin credentials (hashed on startup)
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=your_strong_admin_password_change_in_production

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=noreply@unimart.edu

# Cloudinary (image hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS (comma-separated allowed origins)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
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
| Auth | `/auth` | Register, login, refresh token, OTP verification |
| OTP | `/otp` | Send and verify delivery OTPs |
| Products | `/products` | CRUD, search, filter, categorize |
| Orders | `/orders` | Create, confirm, deliver, complete |
| Chat | `/chat` | Order-scoped messaging |
| Upload | `/upload` | Cloudinary image upload with validation |
| Admin | `/admin` | Full admin management suite (20+ endpoints) |

---

## Security Architecture

### Student Authentication
- **JWT Bearer tokens** — stateless, 30-minute expiry
- **Refresh tokens** — 7-day expiry with separate secret
- **bcrypt** password hashing (cost factor: default bcrypt strength)
- **Register number binding** — every JWT is tied to a register number
- **Token validation** — FastAPI dependencies with OAuth2 password flow

### Admin Authentication
- **Completely separate JWT** with `token_type: "admin"` claim
- Admin tokens use a **different secret** than student tokens
- Student tokens cannot access admin endpoints (token type guard)
- Every admin action is recorded in `admin_audit_logs` with IP tracking
- Default admin account seeded on first startup (credentials from .env)

### OTP Security
- Generated using `secrets.randbelow` (cryptographically secure)
- **Never stored in PostgreSQL** — Redis only with 600-second TTL (10 minutes)
- **Brute-force protection** — invalidated after 5 failed attempts
- Delivered to **official university email only** (not personal email)
- Separate OTPs for registration and delivery verification

### Rate Limiting
- **Redis-based sliding window** with IP tracking
- Auth endpoints: 10 requests / 60 seconds (STRICT)
- Admin endpoints: 10 requests / 60 seconds (STRICT)
- Standard endpoints: 60 requests / 60 seconds (NORMAL)
- Upload endpoints: 200 requests / 60 seconds (RELAXED)
- **Fails open** if Redis unavailable (availability > strict security)

### Database Security
- **Connection pooling** — pool_size=10, max_overflow=20, pre-ping health checks
- **Soft deletes** — Users and products marked deleted, not removed (FK integrity)
- **Cascade rules** — ProductImage and ChatMessage cascade delete with parent
- **Registry validation** — Foreign key constraint on official_records prevents unauthorized signups

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

## Database Schema

### Core Tables

**official_records** (Master Registry - Read-Only)
- `register_number` (PK) — Student registration number
- `full_name` — Student's full name
- `university` — University name
- `college` — College within university
- `department` — Academic department
- `official_email` — University-issued email
- Seeded from `official_data.csv`

**user_profiles** (Student Accounts)
- `register_number` (PK, FK to official_records) — Links to registry
- `username` (unique) — Display name
- `hashed_password` — bcrypt hashed
- `profile_picture_url` — Optional profile image
- `personal_mail_id` — Personal email
- `phone_number` — Contact number
- `is_suspended`, `is_deleted` — Soft delete flags
- `deleted_at`, `deletion_note` — Audit trail

**products**
- `id` (PK) — Auto-increment
- `seller_register_number` (FK to user_profiles)
- `title`, `description` — Product details
- `price` — Decimal(10, 2)
- `category` — Product category
- `image_urls` — JSON array (deprecated, use product_images)
- `product_status` — Enum: AVAILABLE, RESERVED, SOLD_OUT, DELETED
- `is_flagged` — Admin moderation flag
- `created_at`, `updated_at`

**product_images** (Multi-Image Support)
- `id` (PK)
- `product_id` (FK to products, CASCADE delete)
- `url` — Cloudinary URL
- `position` — Display order (integer)
- `created_at`

**orders**
- `id` (PK)
- `product_id` (FK to products)
- `buyer_register_number` (FK to user_profiles)
- `seller_register_number` (FK to user_profiles)
- `order_status` — Enum: PENDING, CONFIRMED, COMPLETED, CANCELLED
- `otp_code` — Delivery verification OTP (optional)
- `created_at`, `completed_at`

**chat_messages**
- `id` (PK)
- `order_id` (FK to orders, CASCADE delete)
- `sender_register_number` (FK to user_profiles)
- `message` — Text (max 2000 chars)
- `sent_at`

**admin_accounts**
- `id` (PK)
- `username` (unique)
- `hashed_password` — bcrypt hashed
- `display_name` — Full name
- `role` — Enum: super_admin
- `is_active` — Account status
- `created_at`, `last_login`

**admin_audit_logs**
- `id` (PK)
- `admin_id` (FK to admin_accounts)
- `admin_username` — Denormalized for performance
- `action` — Action type (e.g., "UPDATE_USER", "DELETE_PRODUCT")
- `target_type` — Target entity type
- `target_id` — Target entity ID
- `details` — JSON with action details
- `ip_address` — Request IP
- `created_at`

---

## Deployment

### Quick Start (Windows)
The project includes automated launcher scripts:

```bash
# Complete system launcher (checks PostgreSQL, Redis, starts both services)
./start.bat

# Backend only
./start-backend.bat

# Frontend only
./start-frontend.bat

# Simplified launcher (minimal checks)
./start-simple.bat
```

These scripts automatically:
- Check for running PostgreSQL and Redis
- Activate virtual environments
- Start uvicorn and vite dev servers
- Display health check URLs

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
