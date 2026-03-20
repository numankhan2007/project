# UNIMART — PART 2 OF 5: Backend Infrastructure Fixes
### Scope: SMTP async fix · DB connection pool · Rate limiting · JWT refresh tokens · Soft deletes · Image storage
### Implement AFTER Part 1 (admin auth must exist first).

---

## CONTEXT

UNIMART uses FastAPI (async), SQLAlchemy, PostgreSQL, Redis, smtplib.
These are critical stability and security fixes. All are mandatory.

---

## FIX 1 — SMTP Async Blocking (`backend/services/email_service.py`)

The current `smtplib` usage blocks the FastAPI async event loop. Replace every `send_email()` call with the async wrapper below.

```python
import asyncio, os, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

async def send_email_async(to: str, subject: str, html_body: str):
    """Wraps smtplib in run_in_executor so it never blocks the event loop."""
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

**Migration:** Find every `send_email(...)` call in the codebase. Replace with `await send_email_async(...)`. Ensure every caller function is `async def`.

---

## FIX 2 — Database Connection Pool (`backend/database.py`)

Replace your `create_engine(DATABASE_URL)` call with the properly configured version below:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,       # base pool connections
    max_overflow=20,    # burst headroom above pool_size
    pool_timeout=30,    # max wait time (seconds) for a connection
    pool_recycle=1800,  # recycle connections every 30 min to prevent stale drops
    pool_pre_ping=True, # verify connection health before use
)
```

---

## FIX 3 — API Rate Limiting (`backend/middleware/rate_limit.py`)

Create this new file:

```python
import os
from fastapi import Request, HTTPException
import redis.asyncio as aioredis

redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def rate_limit(request: Request, limit: int = 60, window: int = 60):
    """Sliding window rate limiter. Default: 60 requests/minute per IP."""
    ip    = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
    key   = f"rl:{request.url.path}:{ip}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, window)
    if count > limit:
        raise HTTPException(429, f"Rate limit exceeded. Try again in {window}s.")

# Convenience factories for different endpoint tiers
def rate_limit_strict(limit=10, window=60):    return lambda r: rate_limit(r, limit, window)
def rate_limit_normal(limit=60, window=60):    return lambda r: rate_limit(r, limit, window)
def rate_limit_relaxed(limit=200, window=60):  return lambda r: rate_limit(r, limit, window)
```

**Apply to routers:**

```python
# Auth and OTP endpoints
@router.post("/login", dependencies=[Depends(rate_limit_strict())])
@router.post("/register", dependencies=[Depends(rate_limit_strict())])

# Standard read/write endpoints
@router.get("/products", dependencies=[Depends(rate_limit_normal())])

# Admin login — extra strict: 5 attempts per 5 minutes
@router.post("/admin/auth/login", dependencies=[Depends(rate_limit_strict(limit=5, window=300))])
```

---

## FIX 4 — JWT Refresh Token Flow (`backend/routers/auth.py`)

Add the following to your existing auth router:

```python
from datetime import datetime, timedelta, UTC
import os
import jwt
from fastapi import Body, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import UserProfile

REFRESH_TOKEN_EXPIRE = timedelta(days=7)
REFRESH_SECRET       = os.getenv("REFRESH_TOKEN_SECRET")

def create_refresh_token(register_number: str) -> str:
    return jwt.encode(
        {
            "sub":        register_number,
            "token_type": "refresh",
            "exp":        datetime.now(UTC) + REFRESH_TOKEN_EXPIRE,
        },
        REFRESH_SECRET,
        algorithm="HS256",
    )

@router.post("/refresh")
async def refresh_access_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
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
```

**Update your login endpoint** to return both tokens:

```python
return {
    "access_token":  create_access_token(user),
    "refresh_token": create_refresh_token(user.register_number),
    "token_type":    "bearer",
}
```

**Frontend — add silent refresh to `src/services/api.js`:**

```javascript
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

## FIX 5 — Soft Deletes for Users (`backend/models.py`)

Add these columns to the `UserProfile` model:

```python
is_deleted    = Column(Boolean, default=False, nullable=False)
deleted_at    = Column(DateTime(timezone=True), nullable=True)
deletion_note = Column(String(500), nullable=True)
```

When admin deletes a user, set `is_deleted=True`, `deleted_at=now()`, `deletion_note=reason`. Do NOT issue a SQL DELETE. Orders and chat history are preserved for dispute resolution.

Add `.filter(UserProfile.is_deleted == False)` to all queries that list or look up users.

---

## FIX 6 — Image Storage (`backend/models.py` + `backend/routers/products.py`)

**Replace the `image_urls` JSON-string column with a proper relational table. Add to `models.py`:**

```python
class ProductImage(Base):
    __tablename__ = "product_images"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url        = Column(String(1024), nullable=False)   # CDN URL or S3 key — NEVER base64
    position   = Column(Integer, default=0)             # ordering index
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Add to Product model:
images = relationship("ProductImage", backref="product", cascade="all, delete-orphan", order_by="ProductImage.position")
```

**Reject base64 strings at the API layer (add to your product create/update schema):**

```python
@validator("image_urls", each_item=True, pre=True)
def reject_base64_images(cls, v):
    if isinstance(v, str) and v.startswith("data:"):
        raise ValueError("Base64 image strings are not accepted. Upload to a CDN and provide a URL.")
    return v
```

**Optional S3 presigned upload endpoint (skip if AWS not configured):**

```python
@router.post("/products/presigned-upload")
async def get_presigned_upload_url(
    filename: str,
    content_type: str,
    current_user=Depends(get_current_user),
):
    if not os.getenv("AWS_S3_BUCKET"):
        raise HTTPException(501, "Cloud storage not configured on this instance")
    import boto3
    from uuid import uuid4
    s3  = boto3.client("s3")
    key = f"products/{current_user.register_number}/{uuid4()}/{filename}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": os.getenv("AWS_S3_BUCKET"), "Key": key, "ContentType": content_type},
        ExpiresIn=300,
    )
    return {"upload_url": url, "cdn_url": f"https://{os.getenv('AWS_CLOUDFRONT_DOMAIN')}/{key}"}
```

---

## FIX 7 — Add `is_flagged` to Products (`backend/models.py`)

```python
# Add to Product model
is_flagged  = Column(Boolean, default=False, nullable=False)
flagged_at  = Column(DateTime(timezone=True), nullable=True)
flag_reason = Column(String(500), nullable=True)
```

---

## ALEMBIC MIGRATION

After all model changes:

```bash
alembic revision --autogenerate -m "infrastructure_fixes"
alembic upgrade head
```

---

## .env ADDITIONS

```bash
REFRESH_TOKEN_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">

# AWS (optional — leave blank if no cloud storage)
AWS_S3_BUCKET=
AWS_CLOUDFRONT_DOMAIN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
```

---

## VERIFICATION CHECKLIST

- [ ] All `send_email()` calls replaced with `await send_email_async()`
- [ ] `pool_size`, `max_overflow`, `pool_pre_ping` set on `create_engine`
- [ ] Rate limiting applied to all auth and admin endpoints
- [ ] `/auth/refresh` endpoint added and login returns both tokens
- [ ] Frontend Axios interceptor silently refreshes on 401
- [ ] `is_deleted`, `deleted_at`, `deletion_note` columns on `UserProfile`
- [ ] `is_flagged` column on `Product`
- [ ] `product_images` table created, replaces JSON column
- [ ] Base64 images rejected at the API validator layer
- [ ] Migration generated and applied
