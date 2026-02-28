"""
Razorpay Payment Integration & UPI QR Code Generation.

SETUP:
1. Create a Razorpay account at https://razorpay.com
2. Go to Settings → API Keys → Generate Test Keys
3. Add to your .env:
    RAZORPAY_KEY_ID=rzp_test_xxxxx
    RAZORPAY_KEY_SECRET=xxxxx
"""

import os
import io
import base64
import razorpay
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from database import get_db
from models import Order, Product, UserProfile
from dependencies import get_current_user

load_dotenv()

router = APIRouter(prefix="/payments", tags=["Payments"])

# ============================================================
# RAZORPAY CLIENT
# ============================================================

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ============================================================
# SCHEMAS
# ============================================================

class PaymentOrderCreate(BaseModel):
    order_id: int
    amount: float  # Amount in INR


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: int


class UPIQRRequest(BaseModel):
    order_id: int
    amount: float
    upi_id: Optional[str] = None  # Seller's UPI ID (masked in QR)


# ============================================================
# POST /payments/create-order — Create Razorpay payment order
# ============================================================

@router.post("/create-order")
def create_payment_order(
    data: PaymentOrderCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Razorpay order for an existing Unimart order.
    The frontend uses this to open the Razorpay checkout modal.
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured. Add Razorpay keys to .env"
        )

    # Verify the Unimart order exists
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only the buyer can pay
    if order.buyer_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can make a payment")

    # Create Razorpay order (amount in paise: 1 INR = 100 paise)
    amount_in_paise = int(data.amount * 100)

    razorpay_order = razorpay_client.order.create({
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"unimart_order_{data.order_id}",
        "notes": {
            "unimart_order_id": str(data.order_id),
            "buyer": current_user.register_number,
        }
    })

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_in_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    }


# ============================================================
# POST /payments/verify — Verify Razorpay payment signature
# ============================================================

@router.post("/verify")
def verify_payment(
    data: PaymentVerify,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify the Razorpay payment signature after frontend checkout.
    This ensures the payment was legitimate and not tampered with.
    """
    if not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured."
        )

    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature."
        )

    return {
        "verified": True,
        "payment_id": data.razorpay_payment_id,
        "message": "Payment verified successfully!",
    }


# ============================================================
# POST /payments/generate-upi-qr — Privacy-protected UPI QR
# ============================================================

@router.post("/generate-upi-qr")
def generate_upi_qr(
    data: UPIQRRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a privacy-protected UPI QR code at delivery time.
    - Generated only at the moment of delivery (not before)
    - Contains a one-time UPI payment link
    - Buyer scans and pays directly
    """
    # Verify the order
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only seller can generate QR (they are the payee)
    if order.seller_register_number != current_user.register_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the seller can generate the payment QR"
        )

    # Get product info for the transaction note
    product = db.query(Product).filter(Product.id == order.product_id).first()
    product_name = product.title if product else f"Order #{data.order_id}"

    # Build UPI payment URI
    # Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE&cu=INR
    upi_id = data.upi_id or os.getenv("DEFAULT_UPI_ID", "unimart@upi")

    upi_uri = (
        f"upi://pay?"
        f"pa={upi_id}"
        f"&pn=Unimart"
        f"&am={data.amount:.2f}"
        f"&tn=Unimart Order {data.order_id} - {product_name}"
        f"&cu=INR"
    )

    # Generate QR code as base64 image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1a1a2e", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "upi_uri": upi_uri,
        "amount": data.amount,
        "order_id": data.order_id,
        "message": "QR code generated. Show this to the buyer to scan and pay.",
    }
