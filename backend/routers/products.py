from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Product, UserProfile, OfficialRecord, ProductStatus
from schemas import ProductCreate, ProductUpdate, ProductResponse
from dependencies import get_current_user
from typing import Optional

router = APIRouter(prefix="/products", tags=["Products"])


# ============================================================
# GET /products — List all products (with optional filters)
# ============================================================

@router.get("/")
def get_all_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """List all available products with optional filters."""
    query = db.query(Product).filter(Product.product_status == ProductStatus.AVAILABLE)

    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.order_by(Product.created_at.desc()).all()

    result = []
    for p in products:
        seller = db.query(UserProfile).filter(UserProfile.register_number == p.seller_register_number).first()
        official = db.query(OfficialRecord).filter(OfficialRecord.register_number == p.seller_register_number).first()
        result.append({
            "id": p.id,
            "seller_register_number": p.seller_register_number,
            "title": p.title,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image_url": p.image_url,
            "product_status": p.product_status,
            "created_at": str(p.created_at) if p.created_at else None,
            "seller_username": seller.username if seller else None,
            "seller_college": official.college if official else None,
            "seller_department": official.department if official else None,
        })

    return result


# ============================================================
# GET /products/search — Search products
# ============================================================

@router.get("/search")
def search_products(q: str = Query(...), db: Session = Depends(get_db)):
    """Search products by title or description."""
    products = db.query(Product).filter(
        Product.product_status == ProductStatus.AVAILABLE,
        or_(
            Product.title.ilike(f"%{q}%"),
            Product.description.ilike(f"%{q}%")
        )
    ).order_by(Product.created_at.desc()).all()

    result = []
    for p in products:
        seller = db.query(UserProfile).filter(UserProfile.register_number == p.seller_register_number).first()
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image_url": p.image_url,
            "product_status": p.product_status,
            "created_at": str(p.created_at) if p.created_at else None,
            "seller_username": seller.username if seller else None,
        })

    return result


# ============================================================
# GET /products/{id} — Get single product
# ============================================================

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    seller = db.query(UserProfile).filter(UserProfile.register_number == product.seller_register_number).first()
    official = db.query(OfficialRecord).filter(OfficialRecord.register_number == product.seller_register_number).first()

    return {
        "id": product.id,
        "seller_register_number": product.seller_register_number,
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "image_url": product.image_url,
        "product_status": product.product_status,
        "created_at": str(product.created_at) if product.created_at else None,
        "seller_username": seller.username if seller else None,
        "seller_college": official.college if official else None,
        "seller_department": official.department if official else None,
    }


# ============================================================
# POST /products — Create a product listing
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product listing. Only authenticated users can sell."""
    new_product = Product(
        seller_register_number=current_user.register_number,
        title=data.title,
        description=data.description,
        price=data.price,
        category=data.category,
        image_url=data.image_url,
        product_status=ProductStatus.AVAILABLE,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "id": new_product.id,
        "seller_register_number": new_product.seller_register_number,
        "title": new_product.title,
        "description": new_product.description,
        "price": new_product.price,
        "category": new_product.category,
        "image_url": new_product.image_url,
        "product_status": new_product.product_status,
        "created_at": str(new_product.created_at) if new_product.created_at else None,
    }


# ============================================================
# PUT /products/{id} — Update a product (owner only)
# ============================================================

@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product listing. Only the seller can update their own product."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own products")

    if data.title is not None:
        product.title = data.title
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price
    if data.category is not None:
        product.category = data.category
    if data.image_url is not None:
        product.image_url = data.image_url

    db.commit()
    db.refresh(product)

    return {
        "id": product.id,
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "image_url": product.image_url,
        "product_status": product.product_status,
    }


# ============================================================
# DELETE /products/{id} — Delete a product (owner only)
# ============================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product listing. Only the seller can delete their own product."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own products")

    db.delete(product)
    db.commit()

    return {"success": True}
