"""
Email service for sending OTP codes to buyers.
Uses fastapi-mail with Gmail SMTP.

SETUP INSTRUCTIONS:
1. Go to your Google Account → Security → 2-Step Verification → App Passwords
2. Generate an App Password for "Mail"
3. Add the following to your .env file:
    MAIL_USERNAME=your.email@gmail.com
    MAIL_PASSWORD=your-16-char-app-password
    MAIL_FROM=your.email@gmail.com
"""

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
import os

load_dotenv()

# Email configuration
mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@unimart.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(mail_config)


async def send_otp_email(to_email: str, otp_code: str, order_id: int, buyer_name: str = "Student"):
    """Send OTP code to the buyer's email address."""

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">🎓 Unimart</h1>
            <p style="color: #6c757d; font-size: 14px;">Secure Student Marketplace</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">Delivery Verification Code</h2>
            <p style="color: #495057; line-height: 1.6;">
                Hi {buyer_name},<br><br>
                The seller has initiated delivery for <strong>Order #{order_id}</strong>.
                Please inspect the product and share this code with the seller only if you are satisfied.
            </p>

            <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background: #e8f4fd; padding: 16px 32px; border-radius: 8px; border: 2px dashed #0d6efd;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #0d6efd;">{otp_code}</span>
                </div>
            </div>

            <p style="color: #dc3545; font-size: 13px; text-align: center;">
                ⚠️ Do NOT share this code until you have inspected the product.
            </p>
        </div>

        <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 16px;">
            This is an automated email from Unimart. Do not reply.
        </p>
    </div>
    """

    message = MessageSchema(
        subject=f"🔐 Unimart Delivery Code — Order #{order_id}",
        recipients=[to_email],
        body=html_body,
        subtype=MessageType.html,
    )

    await fast_mail.send_message(message)


async def send_transaction_complete_email(to_email: str, order_id: int, product_title: str, seller_name: str = "Seller"):
    """Send transaction completion notification to the seller."""

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">🎓 Unimart</h1>
            <p style="color: #6c757d; font-size: 14px;">Secure Student Marketplace</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #28a745; font-size: 20px; margin-top: 0;">✅ Transaction Complete!</h2>
            <p style="color: #495057; line-height: 1.6;">
                Hi {seller_name},<br><br>
                Your item <strong>"{product_title}"</strong> (Order #{order_id}) has been successfully delivered and verified.
                The item is now marked as <strong>Sold Out</strong>.
            </p>

            <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-top: 16px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                    📌 <strong>Reminder:</strong> This listing will be automatically removed in 7 days.
                    You may also delete it manually from your dashboard.
                </p>
            </div>
        </div>

        <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 16px;">
            This is an automated email from Unimart. Do not reply.
        </p>
    </div>
    """

    message = MessageSchema(
        subject=f"✅ Transaction Complete — Order #{order_id}",
        recipients=[to_email],
        body=html_body,
        subtype=MessageType.html,
    )

    await fast_mail.send_message(message)
