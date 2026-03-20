# UNIMART — PART 1 OF 5: Backend Admin Auth
### Scope: admin_models.py · admin_auth.py · admin_schemas.py · .env changes
### Implement this file FIRST before any other part.

---

## CONTEXT

UNIMART is a React 18 + FastAPI marketplace for verified university students.
Stack: FastAPI (async), SQLAlchemy, Alembic, PostgreSQL, Redis, bcrypt, PyJWT.

---

## TASK: Replace the plaintext admin key system with a proper DB-backed admin account.

---

### Step 1 — Create `backend/admin_models.py` (new file)

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base

class AdminAccount(Base):
    __tablename__ = "admin_accounts"
    id               = Column(Integer, primary_key=True, autoincrement=True)
    username         = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    display_name     = Column(String(100), nullable=False)
    role             = Column(Enum("super_admin"), default="super_admin", nullable=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    last_login       = Column(DateTime(timezone=True), nullable=True)

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

---

### Step 2 — Create `backend/admin_auth.py` (new file)

```python
import os
from datetime import datetime, timedelta, UTC
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from admin_models import AdminAccount

ADMIN_JWT_SECRET   = os.getenv("ADMIN_JWT_SECRET")   # separate secret — never share with student JWT
ADMIN_TOKEN_EXPIRE = timedelta(hours=8)
bcrypt_context     = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_token(admin: AdminAccount) -> str:
    payload = {
        "sub":        str(admin.id),
        "username":   admin.username,
        "role":       admin.role,
        "token_type": "admin",   # REQUIRED — explicit type guard prevents token substitution
        "exp":        datetime.now(UTC) + ADMIN_TOKEN_EXPIRE,
        "iat":        datetime.now(UTC),
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm="HS256")

def decode_admin_token(token: str) -> dict:
    payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=["HS256"])
    if payload.get("token_type") != "admin":
        raise HTTPException(403, "Token type mismatch — not an admin token")
    return payload

def get_current_admin(credentials=Depends(HTTPBearer()), db=Depends(get_db)):
    payload = decode_admin_token(credentials.credentials)
    admin   = db.query(AdminAccount).filter_by(id=int(payload["sub"]), is_active=True).first()
    if not admin:
        raise HTTPException(401, "Admin account deactivated or not found")
    return admin

def seed_super_admin(db):
    """Safe to call multiple times. Call inside the lifespan startup handler in main.py."""
    username = os.getenv("ADMIN_USERNAME", "superadmin")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_PASSWORD env variable is not set. Refusing to start.")
    if not db.query(AdminAccount).filter_by(username=username).first():
        db.add(AdminAccount(
            username=username,
            hashed_password=bcrypt_context.hash(password),
            display_name=os.getenv("ADMIN_DISPLAY_NAME", "Super Admin"),
        ))
        db.commit()

def log_admin_action(db, admin, action: str, target_type: str, target_id: str, details: dict, ip: str):
    import json
    from admin_models import AdminAuditLog
    db.add(AdminAuditLog(
        admin_id=admin.id,
        admin_username=admin.username,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=json.dumps(details),
        ip_address=ip,
    ))
    db.commit()
```

---

### Step 3 — Create `backend/admin_schemas.py` (new file)

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)

class AdminTokenResponse(BaseModel):
    access_token:  str
    token_type:    str = "bearer"
    admin_username: str
    display_name:  str
    role:          str

class DashboardStats(BaseModel):
    total_users:               int
    active_users:              int
    suspended_users:           int
    total_products:            int
    available_products:        int
    reserved_products:         int
    sold_products:             int
    total_orders:              int
    pending_orders:            int
    completed_orders:          int
    cancelled_orders:          int
    recent_registrations_7d:   int
    recent_orders_7d:          int

class AdminUserView(BaseModel):
    register_number:        str
    username:               str
    full_name:              str
    university:             str
    college:                str
    department:             str
    official_email:         str
    personal_mail_id:       Optional[str]
    phone_number:           Optional[str]
    is_suspended:           bool
    is_email_verified:      bool
    created_at:             datetime
    total_products:         int
    total_orders_as_buyer:  int
    total_orders_as_seller: int

class SuspendUserRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)

class AdminUserUpdate(BaseModel):
    username:        Optional[str] = Field(None, min_length=3, max_length=50)
    personal_mail_id: Optional[str] = None
    phone_number:    Optional[str] = None

class AdminProductStatusUpdate(BaseModel):
    product_status: str = Field(..., pattern="^(AVAILABLE|RESERVED|SOLD_OUT|REMOVED)$")
    reason:         Optional[str] = Field(None, max_length=500)

class AdminOrderStatusOverride(BaseModel):
    order_status: str = Field(..., pattern="^(PENDING|CONFIRMED|IN_DELIVERY|COMPLETED|CANCELLED)$")
    reason:       str = Field(..., min_length=5, max_length=500)  # mandatory for overrides

class PaginatedResponse(BaseModel):
    items:       list
    total:       int
    page:        int
    page_size:   int
    total_pages: int
```

---

### Step 4 — Update `backend/main.py`

Inside your existing `lifespan` handler, add:

```python
from admin_auth import seed_super_admin
from routers.admin import router as admin_router

# inside lifespan startup:
with SessionLocal() as db:
    seed_super_admin(db)

app.include_router(admin_router)
```

---

### Step 5 — Update `.env`

**Add these variables:**
```
ADMIN_JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=<strong password — minimum 16 chars>
ADMIN_DISPLAY_NAME=Super Admin
```

**Remove these variables (delete entirely):**
```
ADMIN_KEY
ADMIN_USERNAME_PLAINTEXT
ADMIN_PASSWORD_PLAINTEXT
```

---

### Step 6 — Alembic migration

```bash
alembic revision --autogenerate -m "add_admin_accounts_and_audit_logs"
alembic upgrade head
```

---

## VERIFICATION

- [ ] `admin_accounts` table exists in DB
- [ ] `admin_audit_logs` table exists in DB
- [ ] Old `ADMIN_KEY` env var and all its usages deleted
- [ ] `seed_super_admin` called in lifespan — app starts without error
- [ ] Admin JWT contains `"token_type": "admin"` — student token rejected by admin routes
