import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
from models import Order, Product, UserProfile, OrderStatus, ProductStatus
from schemas import OTPGenerate, OTPVerify, OTPSendEmail
from dependencies import get_current_user
from services.email_service import send_otp_email, send_transaction_complete_email
from redis_client import redis_client

router = APIRouter(prefix="/otp", tags=["OTP Handshake"])

DELIVERY_OTP_EXPIRY = 600  # 10 minutes
DELIVERY_OTP_MAX_ATTEMPTS = 5


# ============================================================
# POST /otp/generate — Generate 6-digit OTP (stored in Redis)
# ============================================================

@router.post("/generate")
def generate_otp(
    data: OTPGenerate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller clicks 'Initiate Delivery'. Generates a 6-digit OTP stored in Redis with TTL."""
    order = db.query(Order).filter(Order.id == data.orderId).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can initiate delivery")

    if order.order_status != OrderStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be CONFIRMED before initiating delivery"
        )

    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis is not connected. Cannot generate OTP.")

    otp = str(secrets.randbelow(900000) + 100000)
    
    # Store OTP in Redis with expiration (NOT in DB — prevents brute-force)
    redis_key = f"delivery_otp:{order.id}"
    redis_client.setex(redis_key, DELIVERY_OTP_EXPIRY, otp)
    
    # Reset attempt counter
    redis_client.delete(f"delivery_otp_attempts:{order.id}")
    
    # Also store in DB for reference (but verification uses Redis)
    order.otp_code = otp
    db.commit()

    return {"otp": otp, "message": "OTP generated. Send it to the buyer's email."}


# ============================================================
# POST /otp/verify — Verify OTP and complete transaction
# ============================================================

@router.post("/verify")
async def verify_otp(
    data: OTPVerify,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller enters OTP. On match: order → COMPLETED, product → SOLD_OUT."""
    order = db.query(Order).filter(Order.id == data.orderId).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can verify OTP")

    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis is not connected.")

    # Check attempt count (brute-force protection)
    attempt_key = f"delivery_otp_attempts:{order.id}"
    attempts = redis_client.get(attempt_key)
    if attempts and int(attempts) >= DELIVERY_OTP_MAX_ATTEMPTS:
        # Invalidate OTP
        redis_client.delete(f"delivery_otp:{order.id}")
        redis_client.delete(attempt_key)
        order.otp_code = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. OTP has been invalidated. Please generate a new one."
        )

    # Verify against Redis (not DB)
    redis_key = f"delivery_otp:{order.id}"
    stored_otp = redis_client.get(redis_key)

    if not stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP has been generated for this order, or it has expired."
        )

    if stored_otp != data.otp:
        # Increment attempt counter
        if attempts:
            redis_client.incr(attempt_key)
        else:
            redis_client.setex(attempt_key, DELIVERY_OTP_EXPIRY, 1)
        
        remaining = DELIVERY_OTP_MAX_ATTEMPTS - (int(attempts or 0) + 1)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining."
        )

    # OTP verified — clean up Redis
    redis_client.delete(redis_key)
    redis_client.delete(attempt_key)

    # Mark order as completed
    order.order_status = OrderStatus.COMPLETED
    order.completed_at = func.now()
    order.otp_code = None  # Clear from DB too

    # Mark product as sold
    product = db.query(Product).filter(Product.id == order.product_id).first()
    if product:
        product.product_status = ProductStatus.SOLD_OUT
        product.sold_at = func.now()

    db.commit()

    # Send transaction complete email to seller (in background)
    seller = db.query(UserProfile).filter(
        UserProfile.register_number == order.seller_register_number
    ).first()

    if seller and product:
        try:
            background_tasks.add_task(
                send_transaction_complete_email,
                to_email=seller.personal_mail_id,
                order_id=order.id,
                product_title=product.title,
                seller_name=seller.username,
            )
        except Exception:
            pass  # Don't fail the transaction if email fails

    return {"verified": True, "message": "Transaction completed successfully!"}


# ============================================================
# POST /otp/send-email — Send OTP to buyer's email
# ============================================================

@router.post("/send-email")
async def send_otp_via_email(
    data: OTPSendEmail,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send OTP to the buyer's email address."""
    order = db.query(Order).filter(Order.id == data.orderId).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can send OTP")

    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis is not connected.")

    # Get OTP from Redis (not DB)
    stored_otp = redis_client.get(f"delivery_otp:{order.id}")
    if not stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generate an OTP first, or the previous OTP has expired."
        )

    # Get buyer name for the email
    buyer = db.query(UserProfile).filter(
        UserProfile.register_number == order.buyer_register_number
    ).first()
    buyer_name = buyer.username if buyer else "Student"

    # Send email synchronously to guarantee delivery
    try:
        await send_otp_email(
            to_email=data.email,
            otp_code=stored_otp,
            order_id=order.id,
            buyer_name=buyer_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

    return {"sent": True, "message": f"OTP sent to {data.email}"}
