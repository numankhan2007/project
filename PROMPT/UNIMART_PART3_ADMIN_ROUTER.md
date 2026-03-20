# UNIMART — PART 3 OF 5: Admin Router (All 20 Endpoints)
### Scope: backend/routers/admin.py (new file)
### Prerequisites: Part 1 complete (admin_models, admin_auth, admin_schemas exist)

---

## CONTEXT

Implement all 20 admin endpoints in `backend/routers/admin.py`.
Every state-mutating endpoint MUST call `log_admin_action(...)` and be protected by `get_current_admin`.

---

## RULES — APPLY TO EVERY ENDPOINT

1. All mutation endpoints require `Depends(get_current_admin)` and `Depends(rate_limit_strict(5, 60))`
2. Read endpoints require `Depends(get_current_admin)` and `Depends(rate_limit_normal())`
3. Return HTTP 404 if resource not found
4. Return HTTP 400 if state transition is invalid
5. Call `log_admin_action(db, admin, action, target_type, target_id, {"before": ..., "after": ...}, ip)` before returning on every write

---

## FULL FILE: `backend/routers/admin.py`

```python
import json
from datetime import datetime, UTC
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import UserProfile, Product, Order        # adjust import paths as needed
from admin_models import AdminAccount, AdminAuditLog
from admin_auth import get_current_admin, create_admin_token, bcrypt_context, log_admin_action
from admin_schemas import (
    AdminLoginRequest, AdminTokenResponse,
    DashboardStats,
    AdminUserView, SuspendUserRequest, AdminUserUpdate,
    AdminProductStatusUpdate,
    AdminOrderStatusOverride,
    PaginatedResponse,
)
from middleware.rate_limit import rate_limit_strict, rate_limit_normal

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@router.post(
    "/auth/login",
    response_model=AdminTokenResponse,
    dependencies=[Depends(rate_limit_strict(limit=5, window=300))],
)
async def admin_login(
    body: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    admin = db.query(AdminAccount).filter_by(username=body.username, is_active=True).first()
    if not admin or not bcrypt_context.verify(body.password, admin.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    admin.last_login = datetime.now(UTC)
    db.commit()

    log_admin_action(db, admin, "ADMIN_LOGIN", "admin_account", str(admin.id), {}, request.client.host)

    return AdminTokenResponse(
        access_token=create_admin_token(admin),
        admin_username=admin.username,
        display_name=admin.display_name,
        role=admin.role,
    )


@router.get("/auth/me", dependencies=[Depends(rate_limit_normal())])
async def admin_me(current_admin: AdminAccount = Depends(get_current_admin)):
    return {
        "id":           current_admin.id,
        "username":     current_admin.username,
        "display_name": current_admin.display_name,
        "role":         current_admin.role,
        "last_login":   current_admin.last_login,
    }


# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────

@router.get(
    "/dashboard/stats",
    response_model=DashboardStats,
    dependencies=[Depends(rate_limit_normal())],
)
async def dashboard_stats(
    _: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from datetime import timedelta
    week_ago = datetime.now(UTC) - timedelta(days=7)

    return DashboardStats(
        total_users              = db.query(UserProfile).filter_by(is_deleted=False).count(),
        active_users             = db.query(UserProfile).filter_by(is_deleted=False, is_suspended=False).count(),
        suspended_users          = db.query(UserProfile).filter_by(is_deleted=False, is_suspended=True).count(),
        total_products           = db.query(Product).count(),
        available_products       = db.query(Product).filter_by(product_status="AVAILABLE").count(),
        reserved_products        = db.query(Product).filter_by(product_status="RESERVED").count(),
        sold_products            = db.query(Product).filter_by(product_status="SOLD_OUT").count(),
        total_orders             = db.query(Order).count(),
        pending_orders           = db.query(Order).filter_by(order_status="PENDING").count(),
        completed_orders         = db.query(Order).filter_by(order_status="COMPLETED").count(),
        cancelled_orders         = db.query(Order).filter_by(order_status="CANCELLED").count(),
        recent_registrations_7d  = db.query(UserProfile).filter(UserProfile.created_at >= week_ago).count(),
        recent_orders_7d         = db.query(Order).filter(Order.created_at >= week_ago).count(),
    )


# ─────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────

@router.get("/users", dependencies=[Depends(rate_limit_normal())])
async def list_users(
    search:         Optional[str]  = Query(None),
    suspended_only: bool           = Query(False),
    page:           int            = Query(1, ge=1),
    page_size:      int            = Query(20, ge=1, le=100),
    _:              AdminAccount   = Depends(get_current_admin),
    db:             Session        = Depends(get_db),
):
    q = db.query(UserProfile).filter_by(is_deleted=False)
    if suspended_only:
        q = q.filter_by(is_suspended=True)
    if search:
        like = f"%{search}%"
        q = q.filter(
            UserProfile.username.ilike(like) |
            UserProfile.register_number.ilike(like) |
            UserProfile.official_email.ilike(like)
        )
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(
        items=[u.__dict__ for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/users/{register_number}", dependencies=[Depends(rate_limit_normal())])
async def get_user(
    register_number: str,
    _:  AdminAccount = Depends(get_current_admin),
    db: Session      = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number, is_deleted=False).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.patch(
    "/users/{register_number}",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def update_user(
    register_number: str,
    body:    AdminUserUpdate,
    request: Request,
    admin:   AdminAccount = Depends(get_current_admin),
    db:      Session      = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number, is_deleted=False).first()
    if not user:
        raise HTTPException(404, "User not found")

    before = {"username": user.username, "personal_mail_id": user.personal_mail_id, "phone_number": user.phone_number}
    if body.username is not None:        user.username         = body.username
    if body.personal_mail_id is not None: user.personal_mail_id = body.personal_mail_id
    if body.phone_number is not None:    user.phone_number     = body.phone_number
    db.commit()

    log_admin_action(db, admin, "USER_UPDATED", "user", register_number, {"before": before, "after": body.dict(exclude_none=True)}, request.client.host)
    return {"message": "User updated"}


@router.post(
    "/users/{register_number}/suspend",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def suspend_user(
    register_number: str,
    body:    SuspendUserRequest,
    request: Request,
    admin:   AdminAccount = Depends(get_current_admin),
    db:      Session      = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number, is_deleted=False).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_suspended:
        raise HTTPException(400, "User is already suspended")

    user.is_suspended = True
    db.commit()

    log_admin_action(db, admin, "USER_SUSPENDED", "user", register_number, {"reason": body.reason}, request.client.host)
    return {"message": "User suspended"}


@router.post(
    "/users/{register_number}/reinstate",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def reinstate_user(
    register_number: str,
    request: Request,
    admin:   AdminAccount = Depends(get_current_admin),
    db:      Session      = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number, is_deleted=False).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.is_suspended:
        raise HTTPException(400, "User is not suspended")

    user.is_suspended = False
    db.commit()

    log_admin_action(db, admin, "USER_REINSTATED", "user", register_number, {}, request.client.host)
    return {"message": "User reinstated"}


@router.delete(
    "/users/{register_number}",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def delete_user(
    register_number: str,
    reason:  Optional[str] = Query(None),
    request: Request       = None,
    admin:   AdminAccount  = Depends(get_current_admin),
    db:      Session       = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number, is_deleted=False).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_deleted   = True
    user.deleted_at   = datetime.now(UTC)
    user.deletion_note = reason
    db.commit()

    log_admin_action(db, admin, "USER_DELETED", "user", register_number, {"reason": reason}, request.client.host)
    return {"message": "User soft-deleted"}


# ─────────────────────────────────────────────
# PRODUCT MANAGEMENT
# ─────────────────────────────────────────────

@router.get("/products", dependencies=[Depends(rate_limit_normal())])
async def list_products(
    search:       Optional[str] = Query(None),
    status:       Optional[str] = Query(None),
    flagged_only: bool          = Query(False),
    page:         int           = Query(1, ge=1),
    page_size:    int           = Query(20, ge=1, le=100),
    _:   AdminAccount = Depends(get_current_admin),
    db:  Session      = Depends(get_db),
):
    q = db.query(Product)
    if status:       q = q.filter_by(product_status=status)
    if flagged_only: q = q.filter_by(is_flagged=True)
    if search:
        like = f"%{search}%"
        q = q.filter(Product.name.ilike(like) | Product.description.ilike(like))
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(
        items=[p.__dict__ for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/products/{product_id}", dependencies=[Depends(rate_limit_normal())])
async def get_product(
    product_id: int,
    _:  AdminAccount = Depends(get_current_admin),
    db: Session      = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.patch(
    "/products/{product_id}/status",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def update_product_status(
    product_id: int,
    body:    AdminProductStatusUpdate,
    request: Request,
    admin:   AdminAccount = Depends(get_current_admin),
    db:      Session      = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    before = product.product_status
    product.product_status = body.product_status
    db.commit()

    log_admin_action(db, admin, "PRODUCT_STATUS_UPDATED", "product", str(product_id), {"before": before, "after": body.product_status, "reason": body.reason}, request.client.host)
    return {"message": "Product status updated"}


@router.post(
    "/products/{product_id}/flag",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def flag_product(
    product_id: int,
    reason:  Optional[str] = Query(None),
    request: Request       = None,
    admin:   AdminAccount  = Depends(get_current_admin),
    db:      Session       = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    product.is_flagged  = True
    product.flagged_at  = datetime.now(UTC)
    product.flag_reason = reason
    db.commit()

    log_admin_action(db, admin, "PRODUCT_FLAGGED", "product", str(product_id), {"reason": reason}, request.client.host)
    return {"message": "Product flagged"}


@router.delete(
    "/products/{product_id}",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def delete_product(
    product_id: int,
    reason:  Optional[str] = Query(None),
    request: Request       = None,
    admin:   AdminAccount  = Depends(get_current_admin),
    db:      Session       = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    db.delete(product)  # hard delete for products (unlike users)
    db.commit()

    log_admin_action(db, admin, "PRODUCT_DELETED", "product", str(product_id), {"reason": reason}, request.client.host)
    return {"message": "Product deleted"}


# ─────────────────────────────────────────────
# ORDER MANAGEMENT
# ─────────────────────────────────────────────

@router.get("/orders", dependencies=[Depends(rate_limit_normal())])
async def list_orders(
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(20, ge=1, le=100),
    _:   AdminAccount = Depends(get_current_admin),
    db:  Session      = Depends(get_db),
):
    q = db.query(Order)
    if status: q = q.filter_by(order_status=status)
    if search:
        like = f"%{search}%"
        q = q.filter(Order.id.cast(str).ilike(like))
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(
        items=[o.__dict__ for o in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/orders/{order_id}", dependencies=[Depends(rate_limit_normal())])
async def get_order(
    order_id: int,
    _:  AdminAccount = Depends(get_current_admin),
    db: Session      = Depends(get_db),
):
    order = db.query(Order).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.patch(
    "/orders/{order_id}/status",
    dependencies=[Depends(rate_limit_strict(5, 60))],
)
async def override_order_status(
    order_id: int,
    body:    AdminOrderStatusOverride,
    request: Request,
    admin:   AdminAccount = Depends(get_current_admin),
    db:      Session      = Depends(get_db),
):
    order = db.query(Order).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    before = order.order_status
    order.order_status = body.order_status
    db.commit()

    log_admin_action(db, admin, "ORDER_STATUS_OVERRIDDEN", "order", str(order_id), {"before": before, "after": body.order_status, "reason": body.reason}, request.client.host)
    return {"message": "Order status overridden"}


# ─────────────────────────────────────────────
# AUDIT LOGS
# ─────────────────────────────────────────────

@router.get("/audit-logs", dependencies=[Depends(rate_limit_normal())])
async def list_audit_logs(
    action:    Optional[str] = Query(None),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(50, ge=1, le=200),
    _:  AdminAccount = Depends(get_current_admin),
    db: Session      = Depends(get_db),
):
    q = db.query(AdminAuditLog)
    if action:
        q = q.filter(AdminAuditLog.action.ilike(f"%{action}%"))
    q = q.order_by(AdminAuditLog.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(
        items=[log.__dict__ for log in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )
```

---

## VERIFICATION CHECKLIST

- [ ] `admin_router` registered in `main.py`
- [ ] All 20 endpoints are reachable via the API
- [ ] Every mutation endpoint writes an audit log row
- [ ] Unauthenticated requests to `/admin/*` return 401 or 403
- [ ] Admin login with wrong credentials returns 401
- [ ] Admin JWT with wrong `token_type` is rejected
- [ ] Rate limiting returns 429 after 5 failed login attempts within 5 minutes
