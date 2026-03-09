"""
SMTP Email Service for Unimart.
Replaces SendGrid with standard Python smtplib for local development.
"""

import os
import smtplib
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# Validate configuration at import time
if not SMTP_EMAIL or not SMTP_PASSWORD:
    print("WARNING: SMTP_EMAIL or SMTP_PASSWORD is not set. Email sending will be logged to console only.")


def _is_configured():
    """Check if SMTP is configured with real credentials."""
    placeholders = ["your_email@gmail.com", "your_app_password", ""]
    return (SMTP_EMAIL not in placeholders) and (SMTP_PASSWORD not in placeholders)


def _send_email(to_email: str, subject: str, html_body: str):
    """Send an email via SMTP with TLS. Falls back to console logging if SMTP is not configured."""
    if not _is_configured():
        print("\n" + "="*50)
        print(f"📧 [EMAIL MOCK] To: {to_email}")
        print(f"📧 [EMAIL MOCK] Subject: {subject}")
        # Extract OTP from body if present for easier debugging
        import re
        otp_match = re.search(r'>(\d{6})<', html_body)
        if otp_match:
            print(f"🔑 [OTP CODE]: {otp_match.group(1)}")
        print(f"⚠️  (SMTP not configured — email not actually sent)")
        print("="*50 + "\n")
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"Email sent successfully to {to_email}!")
    except Exception as e:
        print(f"CRITICAL: Failed to send email to {to_email}: {e}")
        traceback.print_exc()
        raise


async def send_registration_otp_email(to_email: str, otp_code: str, student_id: str):
    """Send OTP code for student registration via SMTP."""

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">🎓 Unimart</h1>
            <p style="color: #6c757d; font-size: 14px;">Secure Student Marketplace</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">Registration Verification Code</h2>
            <p style="color: #495057; line-height: 1.6;">
                Welcome to Unimart!<br><br>
                Please use the following OTP to verify your registration for <strong>{student_id}</strong>.
            </p>

            <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background: #e8f4fd; padding: 16px 32px; border-radius: 8px; border: 2px dashed #0d6efd;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #0d6efd;">{otp_code}</span>
                </div>
            </div>

            <p style="color: #dc3545; font-size: 13px; text-align: center;">
                ⚠️ This code will expire in 10 minutes. Do NOT share it with anyone.
            </p>
        </div>

        <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 16px;">
            This is an automated email from Unimart. Do not reply.
        </p>
    </div>
    """

    print(f"Sending registration OTP to {to_email} for {student_id}...")
    _send_email(to_email, "🔐 Unimart Registration Verification Code", html_body)


async def send_otp_email(to_email: str, otp_code: str, order_id: int, buyer_name: str = "Student"):
    """Send OTP code to the buyer's email address via SMTP."""

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

    print(f"Sending delivery OTP to {to_email} for Order #{order_id}...")
    _send_email(to_email, f"🔐 Unimart Delivery Code — Order #{order_id}", html_body)


async def send_transaction_complete_email(to_email: str, order_id: int, product_title: str, seller_name: str = "Seller"):
    """Send transaction completion notification to the seller via SMTP."""

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

    print(f"Sending transaction complete email to {to_email} for Order #{order_id}...")
    _send_email(to_email, f"✅ Transaction Complete — Order #{order_id}", html_body)
