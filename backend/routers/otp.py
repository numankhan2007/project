import random
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
from models import Order, Product, UserProfile, OrderStatus, ProductStatus
from schemas import OTPGenerate, OTPVerify, OTPSendEmail
from dependencies import get_current_user
from email_service import send_otp_email, send_transaction_complete_email

router = APIRouter(prefix="/otp", tags=["OTP Handshake"])


# ============================================================
# POST /otp/generate — Generate 4-digit OTP
# ============================================================

@router.post("/generate")
def generate_otp(
    data: OTPGenerate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seller clicks 'Initiate Delivery'. Generates a 4-digit OTP."""
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

    otp = str(random.randint(1000, 9999))
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

    if not order.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP has been generated for this order"
        )

    if order.otp_code != data.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please try again."
        )

    # Mark order as completed
    order.order_status = OrderStatus.COMPLETED
    order.completed_at = func.now()
    order.otp_code = None

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

    if not order.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generate an OTP first"
        )

    # Get buyer name for the email
    buyer = db.query(UserProfile).filter(
        UserProfile.register_number == order.buyer_register_number
    ).first()
    buyer_name = buyer.username if buyer else "Student"

    # Send email in background (non-blocking)
    try:
        background_tasks.add_task(
            send_otp_email,
            to_email=data.email,
            otp_code=order.otp_code,
            order_id=order.id,
            buyer_name=buyer_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

    return {"sent": True, "message": f"OTP sent to {data.email}"}
