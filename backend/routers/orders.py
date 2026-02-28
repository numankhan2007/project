from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
from models import Order, Product, UserProfile, OrderStatus, ProductStatus
from schemas import OrderCreate, OrderStatusUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


# ============================================================
# POST /orders — Create an order (buyer)
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buyer creates an order for a product."""
    # Find the product
    product = db.query(Product).filter(Product.id == data.product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.product_status != ProductStatus.AVAILABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is no longer available")

    if product.seller_register_number == current_user.register_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot buy your own product")

    # Create the order
    new_order = Order(
        product_id=product.id,
        buyer_register_number=current_user.register_number,
        seller_register_number=product.seller_register_number,
        order_status=OrderStatus.PENDING,
    )
    db.add(new_order)

    # Reserve the product
    product.product_status = ProductStatus.RESERVED

    db.commit()
    db.refresh(new_order)

    return {
        "id": new_order.id,
        "product_id": new_order.product_id,
        "buyer_register_number": new_order.buyer_register_number,
        "seller_register_number": new_order.seller_register_number,
        "order_status": new_order.order_status,
        "created_at": str(new_order.created_at) if new_order.created_at else None,
    }


# ============================================================
# GET /orders/buyer — List buyer's orders
# ============================================================

@router.get("/buyer")
def get_buyer_orders(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders where the current user is the buyer."""
    orders = db.query(Order).filter(
        Order.buyer_register_number == current_user.register_number
    ).order_by(Order.created_at.desc()).all()

    return _format_orders(orders, db)


# ============================================================
# GET /orders/seller — List seller's orders
# ============================================================

@router.get("/seller")
def get_seller_orders(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders where the current user is the seller."""
    orders = db.query(Order).filter(
        Order.seller_register_number == current_user.register_number
    ).order_by(Order.created_at.desc()).all()

    return _format_orders(orders, db)


# ============================================================
# GET /orders/{id} — Get single order
# ============================================================

@router.get("/{order_id}")
def get_order(
    order_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single order. Only the buyer or seller can view it."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this order")

    product = db.query(Product).filter(Product.id == order.product_id).first()
    buyer = db.query(UserProfile).filter(UserProfile.register_number == order.buyer_register_number).first()
    seller = db.query(UserProfile).filter(UserProfile.register_number == order.seller_register_number).first()

    return {
        "id": order.id,
        "product_id": order.product_id,
        "buyer_register_number": order.buyer_register_number,
        "seller_register_number": order.seller_register_number,
        "order_status": order.order_status,
        "created_at": str(order.created_at) if order.created_at else None,
        "completed_at": str(order.completed_at) if order.completed_at else None,
        "product_title": product.title if product else None,
        "product_price": product.price if product else None,
        "product_image": product.image_url if product else None,
        "buyer_username": buyer.username if buyer else None,
        "seller_username": seller.username if seller else None,
    }


# ============================================================
# PUT /orders/{id}/status — Update order status
# ============================================================

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status. Seller confirms, either party can cancel."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only involved parties can update
    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_status = data.status.upper()

    # Validate status transition
    if new_status == OrderStatus.CONFIRMED and order.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can confirm an order")

    if new_status == OrderStatus.CANCELLED:
        # Release the product back to available
        product = db.query(Product).filter(Product.id == order.product_id).first()
        if product and product.product_status == ProductStatus.RESERVED:
            product.product_status = ProductStatus.AVAILABLE

    order.order_status = new_status

    if new_status == OrderStatus.COMPLETED:
        order.completed_at = func.now()

    db.commit()
    db.refresh(order)

    return {"id": order.id, "status": order.order_status}


# ============================================================
# Helper function
# ============================================================

def _format_orders(orders, db):
    """Format a list of orders with product and user details."""
    result = []
    for o in orders:
        product = db.query(Product).filter(Product.id == o.product_id).first()
        buyer = db.query(UserProfile).filter(UserProfile.register_number == o.buyer_register_number).first()
        seller = db.query(UserProfile).filter(UserProfile.register_number == o.seller_register_number).first()
        result.append({
            "id": o.id,
            "product_id": o.product_id,
            "buyer_register_number": o.buyer_register_number,
            "seller_register_number": o.seller_register_number,
            "order_status": o.order_status,
            "created_at": str(o.created_at) if o.created_at else None,
            "completed_at": str(o.completed_at) if o.completed_at else None,
            "product_title": product.title if product else None,
            "product_price": product.price if product else None,
            "product_image": product.image_url if product else None,
            "buyer_username": buyer.username if buyer else None,
            "seller_username": seller.username if seller else None,
        })
    return result
