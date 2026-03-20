# UNIMART — SUPER FORCE IMPLEMENTATION PROMPT
### For: AI Coding Assistants, Senior Developers, Full-Stack Engineers
### Scope: Admin Module + All Architectural Improvements + UI/UX Overhaul

---

## ⚡ READ THIS FIRST — NON-NEGOTIABLE RULES

You are implementing a **complete, production-ready upgrade** to UNIMART — a closed-ecosystem university marketplace. Every instruction below is mandatory. Do not skip sections. Do not simplify. Do not omit. If you encounter ambiguity, implement the **more complete and more secure** option.

---

## SECTION 1 — PROJECT CONTEXT

UNIMART is a React 18 + FastAPI marketplace for verified university students. Students can only register if they exist in the `official_records` master registry. Transactions use a physical OTP handshake for delivery verification. The system must remain a **closed, trust-first ecosystem**.

**Existing Tech Stack:**
- Frontend: React 18, Vite, TailwindCSS, Framer Motion, Lucide React, React Router DOM, Axios, React Context API
- Backend: FastAPI (async), SQLAlchemy, Alembic, APScheduler, Redis, PostgreSQL
- Mail: smtplib (local dev)

---

## SECTION 2 — BACKEND CRITICAL FIXES (implement ALL before anything else)

### 2.1 — Fix Admin Auth (CRITICAL SECURITY — implement first)

**Delete** the old plaintext `.env` admin key approach entirely. Replace with:

```python
# backend/admin_models.py
class AdminAccount(Base):
    __tablename__ = "admin_accounts"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    username      = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name  = Column(String(100), nullable=False)
    role          = Column(Enum("super_admin"), default="super_admin", nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    last_login    = Column(DateTime(timezone=True), nullable=True)

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    admin_id       = Column(Integer, ForeignKey("admin_accounts.id"), nullable=False)
    admin_username = Column(String(50), nullable=False)
    action         = Column(String(80), nullable=False)
    target_type    = Column(String(50), nullable=False)
    target_id      = Column(String(100), nullable=False)
    details        = Column(Text, nullable=True)   # JSON blob: before/after state
    ip_address     = Column(String(45), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
```

**Admin JWT** must include `"token_type": "admin"` in the payload so it can NEVER be confused with or substituted for a student JWT:

```python
# backend/admin_auth.py
ADMIN_JWT_SECRET    = os.getenv("ADMIN_JWT_SECRET")  # separate secret, never share with student JWT secret
ADMIN_TOKEN_EXPIRE  = timedelta(hours=8)

def create_admin_token(admin: AdminAccount) -> str:
    payload = {
        "sub": str(admin.id),
        "username": admin.username,
        "role": admin.role,
        "token_type": "admin",   # ← REQUIRED — explicit token type guard
        "exp": datetime.now(UTC) + ADMIN_TOKEN_EXPIRE,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm="HS256")

def decode_admin_token(token: str) -> dict:
    payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=["HS256"])
    if payload.get("token_type") != "admin":
        raise HTTPException(403, "Token type mismatch — not an admin token")
    return payload

def get_current_admin(credentials = Depends(HTTPBearer()), db = Depends(get_db)):
    payload = decode_admin_token(credentials.credentials)
    admin = db.query(AdminAccount).filter_by(id=int(payload["sub"]), is_active=True).first()
    if not admin:
        raise HTTPException(401, "Admin account deactivated or not found")
    return admin
```

**Seed on startup** (inside lifespan, safe to call multiple times):

```python
# Call this inside your existing lifespan handler in main.py
def seed_super_admin(db: Session):
    username = os.getenv("ADMIN_USERNAME", "superadmin")
    password = os.getenv("ADMIN_PASSWORD")         # REQUIRED — crash loudly if missing
    if not password:
        raise RuntimeError("ADMIN_PASSWORD env variable is not set. Refusing to start.")
    if not db.query(AdminAccount).filter_by(username=username).first():
        db.add(AdminAccount(
            username=username,
            hashed_password=bcrypt_context.hash(password),
            display_name=os.getenv("ADMIN_DISPLAY_NAME", "Super Admin"),
        ))
        db.commit()
```

**Add to `.env`:**
```
ADMIN_JWT_SECRET=<generate with: python -c "import secrets; print(secrets.token_hex(64))">
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=<strong password — minimum 16 chars>
ADMIN_DISPLAY_NAME=Super Admin
```

**Remove from `.env`:** `ADMIN_KEY`, `ADMIN_USERNAME_PLAINTEXT`, `ADMIN_PASSWORD_PLAINTEXT` (any old plaintext admin vars)

---

### 2.2 — Fix SMTP Async Blocking (CRITICAL — implement second)

The current `smtplib` usage blocks the FastAPI async event loop. Fix it now:

```python
# backend/services/email_service.py

import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

async def send_email_async(to: str, subject: str, html_body: str):
    """
    Wraps smtplib in run_in_executor so it never blocks the event loop.
    Drop-in replacement for any existing send_email() calls.
    """
    def _blocking_send():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = os.getenv("SMTP_FROM")
        msg["To"]      = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", 587))) as server:
            server.starttls()
            server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            server.sendmail(msg["From"], to, msg.as_string())

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _blocking_send)
```

**Migration:** Replace every `send_email(...)` call in your codebase with `await send_email_async(...)`. Update all caller functions to be `async def`.

---

### 2.3 — Fix Image Storage (implement third)

The current `image_urls` JSON-string-in-a-column is fragile. Add a proper relational table and integrate an optional cloud storage presigned URL flow:

```python
# Add to models.py
class ProductImage(Base):
    __tablename__ = "product_images"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url        = Column(String(1024), nullable=False)   # CDN URL or S3 key — NEVER base64
    position   = Column(Integer, default=0)             # ordering
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Add relationship to Product model
images = relationship("ProductImage", backref="product", cascade="all, delete-orphan", order_by="ProductImage.position")
```

**Add input validation** to reject base64 strings at the API layer:

```python
# backend/routers/products.py — add this validator to your product create/update schema
@validator("image_urls", each_item=True, pre=True)
def reject_base64_images(cls, v):
    if isinstance(v, str) and v.startswith("data:"):
        raise ValueError("Base64 image strings are not accepted. Upload to a CDN and provide a URL.")
    return v
```

**Optional S3 presigned upload flow** (add this endpoint, works without AWS too — just skip if not configured):

```python
@router.post("/products/presigned-upload")
async def get_presigned_upload_url(
    filename: str,
    content_type: str,
    current_user = Depends(get_current_user)
):
    """
    Returns a presigned S3 URL for direct browser-to-S3 upload.
    If AWS is not configured, returns a 501 gracefully.
    """
    if not os.getenv("AWS_S3_BUCKET"):
        raise HTTPException(501, "Cloud storage not configured on this instance")
    s3 = boto3.client("s3")
    key = f"products/{current_user.register_number}/{uuid4()}/{filename}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": os.getenv("AWS_S3_BUCKET"), "Key": key, "ContentType": content_type},
        ExpiresIn=300,
    )
    return {"upload_url": url, "cdn_url": f"https://{os.getenv('AWS_CLOUDFRONT_DOMAIN')}/{key}"}
```

---

### 2.4 — Fix Database Connection Pool (implement fourth)

```python
# backend/database.py — replace your create_engine call with this
engine = create_engine(
    DATABASE_URL,
    pool_size=10,          # base pool
    max_overflow=20,       # burst headroom
    pool_timeout=30,       # wait at most 30s for a connection
    pool_recycle=1800,     # recycle connections every 30min (prevents stale conn drops)
    pool_pre_ping=True,    # verify connection health before use
)
```

---

### 2.5 — Add API Rate Limiting (implement fifth)

```python
# backend/middleware/rate_limit.py
from fastapi import Request, HTTPException
import redis.asyncio as aioredis

redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def rate_limit(request: Request, limit: int = 60, window: int = 60):
    """
    Sliding window rate limiter. Default: 60 requests/minute per IP.
    Usage: add `Depends(rate_limit)` to any endpoint, or use the factories below.
    """
    ip  = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
    key = f"rl:{request.url.path}:{ip}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, window)
    if count > limit:
        raise HTTPException(429, f"Rate limit exceeded. Try again in {window}s.")

# Convenience factories for different endpoint tiers
def rate_limit_strict(limit=10, window=60):   return lambda r: rate_limit(r, limit, window)   # auth endpoints
def rate_limit_normal(limit=60, window=60):   return lambda r: rate_limit(r, limit, window)   # standard endpoints
def rate_limit_relaxed(limit=200, window=60): return lambda r: rate_limit(r, limit, window)   # read endpoints
```

**Apply to routers:**
```python
# /auth/login, /auth/register, /otp/* endpoints
@router.post("/login", dependencies=[Depends(rate_limit_strict())])

# /products, /orders endpoints
@router.get("/products", dependencies=[Depends(rate_limit_normal())])

# Admin endpoints
@router.post("/admin/auth/login", dependencies=[Depends(rate_limit_strict(limit=5, window=300))])
```

---

### 2.6 — Add JWT Refresh Token Flow (implement sixth)

```python
# backend/routers/auth.py — add refresh token support

REFRESH_TOKEN_EXPIRE = timedelta(days=7)
REFRESH_SECRET = os.getenv("REFRESH_TOKEN_SECRET")  # separate secret

def create_refresh_token(register_number: str) -> str:
    return jwt.encode(
        {"sub": register_number, "token_type": "refresh", "exp": datetime.now(UTC) + REFRESH_TOKEN_EXPIRE},
        REFRESH_SECRET, algorithm="HS256"
    )

@router.post("/refresh")
async def refresh_access_token(refresh_token: str = Body(..., embed=True), db = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")

    if payload.get("token_type") != "refresh":
        raise HTTPException(403, "Token type mismatch")

    user = db.query(UserProfile).filter_by(register_number=payload["sub"]).first()
    if not user or user.is_suspended:
        raise HTTPException(401, "User not found or suspended")

    return {"access_token": create_access_token(user), "token_type": "bearer"}

# Update login endpoint to return both tokens
# return {"access_token": ..., "refresh_token": create_refresh_token(user.register_number), ...}
```

**Frontend: Add silent refresh in Axios interceptor:**

```javascript
// src/services/api.js — add to your existing response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post("/auth/refresh", { refresh_token: refreshToken });
        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers["Authorization"] = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

### 2.7 — Add Soft Deletes for Users (implement seventh)

```python
# Add to UserProfile model in models.py
is_deleted     = Column(Boolean, default=False, nullable=False)
deleted_at     = Column(DateTime(timezone=True), nullable=True)
deletion_note  = Column(String(500), nullable=True)

# Add a global query filter so soft-deleted users never appear in normal queries:
# Option A: SQLAlchemy hybrid property
# Option B: Add .filter(UserProfile.is_deleted == False) to all queries (simpler)
# Recommended: Use SQLAlchemy event listener:

from sqlalchemy import event
@event.listens_for(UserProfile, "init")
def receive_init(target, args, kwargs):
    pass  # placeholder — implement filter via base query in your get_db or repo layer
```

**When admin deletes a user:** set `is_deleted=True, deleted_at=now(), deletion_note=reason` rather than actually deleting. Orders and chat history are preserved for dispute resolution.

---

### 2.8 — Run Alembic Migration

After implementing all model changes, generate a migration:

```bash
alembic revision --autogenerate -m "admin_module_and_improvements"
alembic upgrade head
```

---

## SECTION 3 — ADMIN MODULE (Full Implementation)

### 3.1 — File Structure

Add these files to your existing backend:

```
backend/
├── admin_models.py        # AdminAccount, AdminAuditLog (Section 2.1)
├── admin_schemas.py       # All Pydantic schemas for admin endpoints
├── admin_auth.py          # Admin JWT, get_current_admin, seed_super_admin
├── routers/
│   └── admin.py           # All 20 admin endpoints (see Section 3.3)
```

Register in `main.py`:
```python
from routers.admin import router as admin_router
app.include_router(admin_router)
```

---

### 3.2 — Admin Pydantic Schemas

```python
# backend/admin_schemas.py

class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)

class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_username: str
    display_name: str
    role: str

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    total_products: int
    available_products: int
    reserved_products: int
    sold_products: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    recent_registrations_7d: int
    recent_orders_7d: int

class AdminUserView(BaseModel):
    register_number: str
    username: str
    full_name: str
    university: str
    college: str
    department: str
    official_email: str
    personal_mail_id: Optional[str]
    phone_number: Optional[str]
    is_suspended: bool
    is_email_verified: bool
    created_at: datetime
    total_products: int
    total_orders_as_buyer: int
    total_orders_as_seller: int

class SuspendUserRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)

class AdminUserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    personal_mail_id: Optional[str] = None
    phone_number: Optional[str] = None

class AdminProductStatusUpdate(BaseModel):
    product_status: str = Field(..., pattern="^(AVAILABLE|RESERVED|SOLD_OUT|REMOVED)$")
    reason: Optional[str] = Field(None, max_length=500)

class AdminOrderStatusOverride(BaseModel):
    order_status: str = Field(..., pattern="^(PENDING|CONFIRMED|IN_DELIVERY|COMPLETED|CANCELLED)$")
    reason: str = Field(..., min_length=5, max_length=500)   # reason is REQUIRED for overrides

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

### 3.3 — Admin Router (All 20 Endpoints)

Implement all endpoints in `backend/routers/admin.py`:

**Auth:**
- `POST /admin/auth/login` → verify credentials, return admin JWT + log ADMIN_LOGIN audit
- `GET  /admin/auth/me` → return current admin info from token

**Dashboard:**
- `GET /admin/dashboard/stats` → return DashboardStats aggregate query

**User Management:**
- `GET    /admin/users` → paginated list, supports `?search=&suspended_only=&page=&page_size=`
- `GET    /admin/users/{register_number}` → full user detail with activity summary
- `PATCH  /admin/users/{register_number}` → edit username, contact info
- `POST   /admin/users/{register_number}/suspend` → set is_suspended=True, audit log
- `POST   /admin/users/{register_number}/reinstate` → set is_suspended=False, audit log
- `DELETE /admin/users/{register_number}` → soft delete, audit log

**Product Management:**
- `GET    /admin/products` → paginated list, supports `?search=&status=&flagged_only=`
- `GET    /admin/products/{id}` → full product detail with seller info
- `PATCH  /admin/products/{id}/status` → override status, audit log
- `POST   /admin/products/{id}/flag` → mark is_flagged=True, audit log
- `DELETE /admin/products/{id}` → hard delete (product listings, unlike users, can be purged), audit log

**Order Management:**
- `GET   /admin/orders` → paginated list, supports `?status=&search=`
- `GET   /admin/orders/{id}` → full order detail
- `PATCH /admin/orders/{id}/status` → override with mandatory reason, audit log

**Audit Logs:**
- `GET /admin/audit-logs` → paginated, supports `?action=&page=`

**Every state-mutating endpoint MUST:**
1. Call `log_admin_action(db, admin, action, target_type, target_id, before_after_dict, ip)` before returning
2. Return HTTP 404 if resource not found, HTTP 400 if invalid state transition
3. Be protected by `Depends(get_current_admin)` and `Depends(rate_limit_strict(5, 60))`

---

## SECTION 4 — FRONTEND: ADMIN PANEL UI/UX

### 4.1 — Routing Setup

```jsx
// src/routes/AppRoutes.jsx — add admin route OUTSIDE ProtectedRoute
<Routes>
  {/* ... existing student routes ... */}
  <Route path="/admin/*" element={<AdminApp />} />
</Routes>
```

The admin panel is a completely separate sub-application. It has its own:
- Auth context (`AdminAuthContext`)
- Axios instance (separate from student API, different base URL `/admin`)
- Route protection (`AdminProtectedRoute`)

```jsx
// src/admin/AdminApp.jsx
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="*" element={
          <AdminProtectedRoute>
            <AdminDashboardLayout />
          </AdminProtectedRoute>
        } />
      </Routes>
    </AdminAuthProvider>
  );
}
```

---

### 4.2 — Design System (MANDATORY — implement exactly)

UNIMART uses a dark, professional aesthetic. The admin panel must extend it with authority and precision. Use these exact design tokens:

```javascript
// src/admin/styles/tokens.js
export const tokens = {
  // Core palette
  bg:            "#0a0c12",
  bgElevated:    "#0f1219",
  surface:       "#141720",
  surfaceHover:  "#191d2a",
  border:        "#1e2333",
  borderLight:   "#263045",

  // Brand
  primary:       "#6c63ff",
  primaryHover:  "#5a52e0",
  primaryActive: "#4a43c8",
  primaryGlow:   "rgba(108, 99, 255, 0.18)",
  primaryShimmer:"rgba(108, 99, 255, 0.06)",

  // Semantic
  accent:        "#00d4aa",    // teal — success actions, online status
  accentGlow:    "rgba(0, 212, 170, 0.14)",
  danger:        "#ff4d6d",    // red — destructive, suspended, errors
  dangerGlow:    "rgba(255, 77, 109, 0.14)",
  warning:       "#f59e0b",    // amber — pending, reserved
  warningGlow:   "rgba(245, 158, 11, 0.14)",
  success:       "#22d47e",    // green — completed, active

  // Text hierarchy
  textPrimary:   "#edf0f7",
  textSecondary: "#7c88a3",
  textMuted:     "#404c65",
  textDisabled:  "#2a3347",

  // Typography
  fontDisplay:   "'Syne', sans-serif",        // headings, brand — sharp, geometric
  fontBody:      "'DM Sans', sans-serif",     // body text — clean, modern
  fontMono:      "'JetBrains Mono', monospace", // IDs, register numbers, code

  // Spacing scale
  radius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", pill: "999px" },

  // Shadows
  shadowSm:  "0 2px 8px rgba(0,0,0,0.3)",
  shadowMd:  "0 4px 20px rgba(0,0,0,0.4)",
  shadowLg:  "0 8px 40px rgba(0,0,0,0.5)",
  shadowGlow: (color) => `0 0 24px ${color}`,
};
```

**Load fonts in index.html:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

### 4.3 — Admin Login Page (CINEMATIC ENTRY ANIMATION — implement exactly)

This is the most important UI moment. It must feel powerful and intentional.

**Visual concept:** Full-screen dark background. A slowly rotating, blurred geometric mesh in the background (CSS-only, no canvas). The login card slides up with a spring animation. Letters in "UNIMART ADMIN" stagger in one-by-one. Subtle particle field or grid lines pulse in the background.

```jsx
// src/admin/pages/AdminLoginPage.jsx
import { motion, AnimatePresence } from "framer-motion";

// Background grid animation (pure CSS, no JS overhead):
// A radial gradient that slowly pulses + a CSS grid overlay

const LETTER_STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  letter:    { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } },
};

const CARD_ENTRY = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  show:    { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 22, delay: 0.5 } },
};

const FIELD_ENTRY = (i) => ({
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: { delay: 0.7 + i * 0.1, duration: 0.35, ease: "easeOut" } },
});

export default function AdminLoginPage() {
  const titleChars = "UNIMART ADMIN".split("");

  return (
    <div style={{ minHeight: "100vh", background: tokens.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

      {/* Animated background layer — CSS grid lines */}
      <div className="admin-bg-grid" />

      {/* Glowing orb behind card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${tokens.primaryGlow} 0%, transparent 70%)`,
          filter: "blur(60px)", pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 24px" }}>

        {/* Staggered title */}
        <motion.div variants={LETTER_STAGGER.container} initial="hidden" animate="show"
          style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 8, flexWrap: "wrap" }}>
          {titleChars.map((char, i) => (
            <motion.span key={i} variants={LETTER_STAGGER.letter}
              style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, letterSpacing: char === " " ? 8 : 0 }}>
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle fade in */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{ textAlign: "center", marginBottom: 32, color: tokens.textMuted, fontSize: 12, letterSpacing: "0.2em", fontFamily: tokens.fontBody }}>
          CONTROL CENTER
        </motion.div>

        {/* Login card */}
        <motion.div variants={CARD_ENTRY} initial="hidden" animate="show"
          style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.xl, padding: 32, boxShadow: tokens.shadowLg }}>

          {/* Icon */}
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.6 }}
            style={{ width: 52, height: 52, borderRadius: tokens.radius.lg, background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 22 }}>
            🔐
          </motion.div>

          <motion.div variants={FIELD_ENTRY(0)} initial="hidden" animate="show">
            {/* Username field */}
          </motion.div>
          <motion.div variants={FIELD_ENTRY(1)} initial="hidden" animate="show">
            {/* Password field */}
          </motion.div>
          <motion.div variants={FIELD_ENTRY(2)} initial="hidden" animate="show">
            {/* Login button */}
          </motion.div>
        </motion.div>

        {/* Security notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ textAlign: "center", marginTop: 20, color: tokens.textMuted, fontSize: 11, fontFamily: tokens.fontMono }}>
          SECURED · ACCESS LOGGED · ACTIONS AUDITED
        </motion.div>
      </div>
    </div>
  );
}
```

**CSS for background grid (add to admin.css):**
```css
.admin-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 8s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
```

**Login button states (IMPLEMENT ALL):**
- Default: `background: primary, color: white`
- Hover: scale(1.02), brightness up, box-shadow glow — use `whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(108,99,255,0.4)" }}`
- Active/tap: scale(0.98) — `whileTap={{ scale: 0.98 }}`
- Loading: spinning ring icon + "Authenticating…" text, button disabled
- Error shake: `animate={{ x: [0, -8, 8, -8, 8, 0] }}` on error
- Success: button turns green with checkmark for 400ms before redirect

---

### 4.4 — Admin Layout (Sidebar + Main)

```jsx
// src/admin/components/AdminLayout.jsx

// Sidebar nav items
const NAV = [
  { id: "dashboard", icon: <LayoutDashboard />, label: "Dashboard",  path: "/admin" },
  { id: "users",     icon: <Users />,           label: "Users",       path: "/admin/users" },
  { id: "products",  icon: <Package />,         label: "Products",    path: "/admin/products" },
  { id: "orders",    icon: <ShoppingCart />,    label: "Orders",      path: "/admin/orders" },
  { id: "audit",     icon: <Shield />,          label: "Audit Logs",  path: "/admin/audit" },
];

// Sidebar entry animation
const sidebarItemVariants = {
  hidden:  { opacity: 0, x: -20 },
  show:    (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 } }),
};

// Active indicator: animated left border + background pill
// On nav change: use AnimatePresence to cross-fade the active indicator
```

**Sidebar hover effects (REQUIRED):**
- Nav item hover: background transitions to `surfaceHover`, slight x-translate (+2px), color shifts to `textPrimary`
- Active item: left accent bar animates in with `layoutId="activeBar"` (shared layout animation)
- Collapsed state (optional): icon-only mode on mobile

**Page transition (REQUIRED on every route change):**
```jsx
// Wrap all admin views in this
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } }}
    exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

---

### 4.5 — Dashboard View

**Stats cards:** 4-column grid. Each card animates in with staggered delay (0.08s apart). On hover: subtle lift (`translateY(-2px)`) + glow border brightens.

**Bar/progress breakdowns:**
- Progress bars animate from 0% to final width on mount using Framer Motion `initial={{ width: 0 }} animate={{ width: "X%" }}`
- Transition: `duration: 0.8, ease: "easeOut"` with stagger delay

**Stats to display:**
```
Row 1: Total Users | Active Users | Total Products | Total Orders
Row 2: Product Status Breakdown (bar chart) | Order Status Breakdown (counts)
Row 3: Registrations this week | Orders this week | Suspended users | Flagged products
```

---

### 4.6 — Users, Products, Orders Views

All three views share the same table structure. Implement a reusable `<AdminTable>` component.

**Table features:**
- Sticky header
- Row hover: background transitions to `surfaceHover` (CSS transition, not JS)
- Alternating row subtle tint
- Sortable columns (click header to sort asc/desc, animated arrow indicator)
- Pagination: prev/next + page number pills
- Search input: debounced 300ms, clears with X button
- Filter dropdowns

**Row actions (IMPLEMENT ALL HOVER STATES):**
Every action button must have:
- `whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}`
- `whileTap={{ scale: 0.95 }}`
- Tooltip on hover (use a lightweight custom tooltip — CSS `::after` or small Framer motion tooltip)
- Color-coded: View=ghost, Suspend=danger variant, Reinstate=success variant

**Detail modals:**
- Entry: `initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}`
- Backdrop: `initial={{ opacity:0 }} animate={{ opacity:1 }}` — semi-transparent blur
- Exit: AnimatePresence with reverse of entry

**Status badges:**
```
AVAILABLE   → green pill (#22d47e)
RESERVED    → amber pill (#f59e0b)
SOLD_OUT    → gray pill
REMOVED     → red pill
PENDING     → amber pill
CONFIRMED   → purple pill (primary)
IN_DELIVERY → teal pill (accent)
COMPLETED   → green pill
CANCELLED   → red pill
SUSPENDED   → red pill
ACTIVE      → green pill
```

---

### 4.7 — Confirmation Modals (for destructive actions)

All destructive actions (suspend, delete, remove, override) must use a two-step confirmation modal:

```jsx
// Pattern for ALL destructive actions:
// Step 1: Click "Suspend" → Modal appears with warning
// Step 2: User must type the username/ID to confirm (like GitHub delete repo)
// Step 3: Confirm button activates only when text matches

<input
  placeholder={`Type "${targetIdentifier}" to confirm`}
  onChange={(e) => setConfirmText(e.target.value)}
/>
<Button disabled={confirmText !== targetIdentifier} variant="danger">
  Confirm Suspend
</Button>
```

---

### 4.8 — Toast Notification System

```jsx
// src/admin/components/AdminToast.jsx
// Position: bottom-right
// Entry: slide in from right + fade
// Exit: slide out right + fade
// Duration: 3000ms auto-dismiss
// Types: success (green), error (red), warning (amber), info (blue)
// Stack: up to 3 toasts visible simultaneously, older ones stack above

const toastVariants = {
  initial: { opacity: 0, x: 60, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 22 } },
  exit:    { opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.18 } },
};
```

---

## SECTION 5 — INTEGRATION CHECKLIST

After implementing everything above, verify each item:

### Backend
- [ ] `admin_accounts` table created via Alembic migration
- [ ] `admin_audit_logs` table created via Alembic migration
- [ ] `product_images` table created (replaces JSON column)
- [ ] Old `ADMIN_KEY` env var and usage deleted everywhere
- [ ] New `ADMIN_JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` in `.env`
- [ ] `seed_super_admin(db)` called in lifespan startup handler
- [ ] `admin_router` registered in `main.py`
- [ ] All `send_email()` calls replaced with `await send_email_async()`
- [ ] `pool_size`, `max_overflow`, `pool_pre_ping` set on `create_engine`
- [ ] Rate limiting applied to all auth and admin endpoints
- [ ] Refresh token endpoint added, login returns both tokens
- [ ] `is_deleted`, `deleted_at` columns added to `UserProfile`
- [ ] `is_flagged` column added to `Product`
- [ ] All CORS origins reviewed for production (remove localhost variants)
- [ ] HTTPS enforced in production (add `--ssl-keyfile`, `--ssl-certfile` to uvicorn or use reverse proxy)

### Frontend
- [ ] `/admin/*` routes added outside `ProtectedRoute`
- [ ] `AdminAuthContext` implemented separately from student `AuthContext`
- [ ] Separate Axios instance for admin API calls
- [ ] Syne + DM Sans + JetBrains Mono fonts loaded
- [ ] Login page cinematic animation working (letter stagger, card spring, orb glow)
- [ ] Background grid CSS animation active on login page
- [ ] All button hover/tap states use Framer Motion `whileHover`/`whileTap`
- [ ] Page transitions use AnimatePresence on route change
- [ ] Sidebar active state uses `layoutId` shared layout animation
- [ ] Stats cards animate in with stagger on dashboard mount
- [ ] Progress bars animate from 0 on mount
- [ ] All modals have spring entry/exit animations
- [ ] Confirmation typing required for all destructive actions
- [ ] Toast notifications stack correctly with spring animations
- [ ] JWT refresh token silently re-authenticates on 401 responses
- [ ] Admin logout clears admin tokens without touching student tokens

---

## SECTION 6 — ENV FILE FINAL STATE

After all changes, `.env` should contain:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unimart

# Redis
REDIS_URL=redis://localhost:6379

# Student JWT (existing)
JWT_SECRET_KEY=<existing key — do not change>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Student Refresh Token (NEW)
REFRESH_TOKEN_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">

# Admin JWT (NEW — separate secret)
ADMIN_JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=<strong-password-min-16-chars>
ADMIN_DISPLAY_NAME=Super Admin

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@unimart.edu

# AWS (optional — skip if no cloud storage)
AWS_S3_BUCKET=
AWS_CLOUDFRONT_DOMAIN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
```

---

## SECTION 7 — IMPLEMENTATION ORDER

Follow this exact order to avoid breaking changes:

```
1. backend: admin_models.py         (new file)
2. backend: admin_auth.py           (new file)
3. backend: admin_schemas.py        (new file)
4. backend: routers/admin.py        (new file)
5. backend: main.py                 (register admin router, call seed_super_admin)
6. backend: services/email_service.py  (fix async blocking)
7. backend: models.py               (add is_deleted, is_flagged, product_images)
8. backend: database.py             (fix connection pool)
9. backend: middleware/rate_limit.py (new file)
10. backend: routers/auth.py        (add refresh token endpoint)
11. alembic: generate + apply migration
12. frontend: install fonts (index.html)
13. frontend: src/admin/styles/tokens.js
14. frontend: src/admin/AdminAuthContext.jsx
15. frontend: src/admin/api/adminApi.js (separate axios instance)
16. frontend: src/admin/pages/AdminLoginPage.jsx
17. frontend: src/admin/components/AdminLayout.jsx (sidebar + layout)
18. frontend: src/admin/pages/Dashboard.jsx
19. frontend: src/admin/pages/Users.jsx
20. frontend: src/admin/pages/Products.jsx
21. frontend: src/admin/pages/Orders.jsx
22. frontend: src/admin/pages/AuditLogs.jsx
23. frontend: src/admin/components/AdminToast.jsx
24. frontend: src/routes/AppRoutes.jsx (add /admin/* route)
25. test: login → dashboard → each section → logout
```

---

## SECTION 8 — ANIMATION REFERENCE CARD

Quick reference for every animation in the admin panel:

| Element | Animation | Spec |
|---|---|---|
| Login page orb | Scale + fade in | duration: 1.2s, ease: easeOut |
| Title letters | Stagger up | stagger: 0.04s, spring: 200/20 |
| Login card | Slide up + scale | spring: 160/22, delay: 0.5s |
| Form fields | Slide in from left | stagger: 0.1s, delay: 0.7s |
| Login button hover | Scale up + glow | scale: 1.02, shadow glow |
| Login button tap | Scale down | scale: 0.98 |
| Login error | Horizontal shake | x: [0,-8,8,-8,8,0] |
| Page transitions | Fade + slide up | duration: 0.22s, exit: 0.15s |
| Sidebar active bar | Layout animation | layoutId: "activeBar" |
| Sidebar item hover | x: +2px, color shift | CSS transition: 0.15s |
| Stat cards stagger | Fade + slide up | stagger: 0.08s per card |
| Stat card hover | translateY(-2px) | CSS transition: 0.2s |
| Progress bars | Width 0→final | duration: 0.8s, easeOut |
| Table row hover | Background shift | CSS transition: 0.12s |
| Action button hover | scale: 1.05 | duration: 0.1s |
| Action button tap | scale: 0.95 | duration: 0.1s |
| Modal backdrop | Opacity 0→1 | duration: 0.2s |
| Modal panel | Scale 0.95→1 + fade | spring: 180/24 |
| Modal exit | Reverse of entry | duration: 0.15s |
| Toast entry | Slide in from right | spring: 200/22 |
| Toast exit | Slide out right | duration: 0.18s |
| Badge pulse (flagged) | Opacity 0.6→1 loop | duration: 2s, ease: easeInOut |

---

*End of prompt. All sections are mandatory. Build it completely.*
