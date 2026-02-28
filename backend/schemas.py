from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============================================================
# AUTH SCHEMAS
# ============================================================

class RegisterNumberVerify(BaseModel):
    register_number: str


class UserSignup(BaseModel):
    register_number: str
    username: str
    password: str
    personal_mail_id: str
    phone_number: Optional[str] = None


class UserLogin(BaseModel):
    studentId: str  # Maps to register_number (matches frontend field name)
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    profile_picture_url: Optional[str] = None
    personal_mail_id: Optional[str] = None
    phone_number: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    user: dict


# ============================================================
# OFFICIAL RECORD RESPONSE
# ============================================================

class OfficialRecordResponse(BaseModel):
    register_number: str
    full_name: str
    university: str
    college: str
    department: str
    official_email: str

    class Config:
        from_attributes = True


# ============================================================
# USER PROFILE RESPONSE
# ============================================================

class UserProfileResponse(BaseModel):
    register_number: str
    username: str
    profile_picture_url: Optional[str] = None
    personal_mail_id: str
    phone_number: Optional[str] = None
    username_change_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserDashboardResponse(BaseModel):
    """Combined response from OfficialRecord JOIN UserProfile"""
    register_number: str
    username: str
    full_name: str
    university: str
    college: str
    department: str
    official_email: str
    profile_picture_url: Optional[str] = None
    personal_mail_id: str
    phone_number: Optional[str] = None
    username_change_count: int
    created_at: Optional[datetime] = None


# ============================================================
# PRODUCT SCHEMAS
# ============================================================

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    seller_register_number: str
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None
    product_status: str
    created_at: Optional[datetime] = None
    seller_username: Optional[str] = None
    seller_college: Optional[str] = None
    seller_department: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# ORDER SCHEMAS
# ============================================================

class OrderCreate(BaseModel):
    product_id: int


class OrderStatusUpdate(BaseModel):
    status: str


class OrderResponse(BaseModel):
    id: int
    product_id: int
    buyer_register_number: str
    seller_register_number: str
    order_status: str
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    product_title: Optional[str] = None
    product_price: Optional[float] = None
    buyer_username: Optional[str] = None
    seller_username: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# CHAT SCHEMAS
# ============================================================

class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    order_id: int
    sender_register_number: str
    message: str
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# OTP SCHEMAS
# ============================================================

class OTPGenerate(BaseModel):
    orderId: int


class OTPVerify(BaseModel):
    orderId: int
    otp: str


class OTPSendEmail(BaseModel):
    orderId: int
    email: str
