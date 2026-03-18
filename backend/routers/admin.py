"""
Admin router for Unimart management operations.
Protected by ADMIN_KEY authentication (separate from user JWT).
"""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import OfficialRecord, UserProfile, Product, ProductStatus
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_KEY = os.getenv("ADMIN_KEY", "unimart-admin-secret-change-this-in-production")


# ============================================================
# Admin Authentication Dependency
# ============================================================

def verify_admin(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    """Verify admin access via X-Admin-Key header."""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key"
        )
    return True


# ============================================================
# Schemas
# ============================================================

class OfficialRecordCreate(BaseModel):
    register_number: str
    full_name: str
    university: str
    college: str
    department: str
    official_email: str


class BulkUploadRequest(BaseModel):
    records: List[OfficialRecordCreate]


# ============================================================
# GET /admin/users — List all user profiles
# ============================================================

@router.get("/users")
def list_users(
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List all registered user profiles with pagination."""
    users = db.query(UserProfile).offset(skip).limit(limit).all()
    total = db.query(UserProfile).count()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": [
            {
                "register_number": u.register_number,
                "username": u.username,
                "personal_mail_id": u.personal_mail_id,
                "phone_number": u.phone_number,
                "created_at": str(u.created_at) if u.created_at else None,
            }
            for u in users
        ],
    }


# ============================================================
# GET /admin/products — List all products
# ============================================================

@router.get("/products")
def list_products(
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
):
    """List all product listings with optional status filter."""
    query = db.query(Product)
    if status_filter:
        query = query.filter(Product.product_status == status_filter)

    products = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [
            {
                "id": p.id,
                "title": p.title,
                "price": p.price,
                "category": p.category,
                "product_status": p.product_status,
                "seller_register_number": p.seller_register_number,
                "created_at": str(p.created_at) if p.created_at else None,
            }
            for p in products
        ],
    }


# ============================================================
# DELETE /admin/products/{product_id} — Remove a product listing
# ============================================================

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """Admin removes a product listing (soft delete)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.product_status = ProductStatus.DELETED
    db.commit()

    return {"deleted": True, "message": f"Product #{product_id} has been removed."}


# ============================================================
# GET /admin/records — List official records
# ============================================================

@router.get("/records")
def list_records(
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """List official student records."""
    records = db.query(OfficialRecord).offset(skip).limit(limit).all()
    total = db.query(OfficialRecord).count()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "records": [
            {
                "register_number": r.register_number,
                "full_name": r.full_name,
                "university": r.university,
                "college": r.college,
                "department": r.department,
                "official_email": r.official_email,
            }
            for r in records
        ],
    }


# ============================================================
# POST /admin/upload-records — Bulk upload official records
# ============================================================

@router.post("/upload-records")
def upload_records(
    data: BulkUploadRequest,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """Bulk upload official student records. Skips duplicates."""
    added = 0
    skipped = 0

    for record_data in data.records:
        existing = db.query(OfficialRecord).filter(
            OfficialRecord.register_number == record_data.register_number.upper()
        ).first()

        if existing:
            skipped += 1
            continue

        new_record = OfficialRecord(
            register_number=record_data.register_number.upper(),
            full_name=record_data.full_name,
            university=record_data.university,
            college=record_data.college,
            department=record_data.department,
            official_email=record_data.official_email,
        )
        db.add(new_record)
        added += 1

    db.commit()

    return {
        "success": True,
        "added": added,
        "skipped": skipped,
        "message": f"Uploaded {added} records, skipped {skipped} duplicates.",
    }


# ============================================================
# DELETE /admin/users/{register_number} — Remove a user
# ============================================================

@router.delete("/users/{register_number}")
def delete_user(
    register_number: str,
    admin: bool = Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """Admin removes a user account. This also soft-deletes their products."""
    user = db.query(UserProfile).filter(
        UserProfile.register_number == register_number.upper()
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft-delete all user's products
    products = db.query(Product).filter(
        Product.seller_register_number == user.register_number
    ).all()
    for p in products:
        p.product_status = ProductStatus.DELETED

    # Delete user profile
    db.delete(user)
    db.commit()

    return {
        "deleted": True,
        "message": f"User {register_number} and their {len(products)} products have been removed.",
    }
