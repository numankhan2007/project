import os
import traceback
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@unimart.com")

# Validate configuration at import time
if not SENDGRID_API_KEY:
    print("WARNING: SENDGRID_API_KEY is not set. Email sending will fail.")

if SENDGRID_FROM_EMAIL in ("your.verified@email.com", "noreply@unimart.com"):
    print(f"WARNING: SENDGRID_FROM_EMAIL is '{SENDGRID_FROM_EMAIL}' — this may not be a verified sender in SendGrid.")


def get_sendgrid_client():
    if not SENDGRID_API_KEY:
        raise ValueError("SENDGRID_API_KEY is not set in environment variables.")
    return SendGridAPIClient(SENDGRID_API_KEY)


def _send_with_retry(message, max_retries=1):
    """Send email with optional retry on transient failure."""
    sg = get_sendgrid_client()
    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            response = sg.send(message)
            print(f"Email sent successfully! Status: {response.status_code}")
            
            if response.status_code >= 400:
                print(f"SendGrid returned error status {response.status_code}")
                print(f"Response body: {response.body}")
                print(f"Response headers: {response.headers}")
            
            return response
        except Exception as e:
            last_error = e
            print(f"Email send attempt {attempt + 1}/{max_retries + 1} failed: {str(e)}")
            if attempt < max_retries:
                print("Retrying...")
    
    # All retries exhausted
    print(f"CRITICAL: All email send attempts failed.")
    traceback.print_exc()
    raise last_error


async def send_registration_otp_email(to_email: str, otp_code: str, student_id: str):
    """Send OTP code for student registration using SendGrid."""

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

    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject="🔐 Unimart Registration Verification Code",
        html_content=html_body,
    )

    print(f"MOCK: OTP code {otp_code} for {student_id} would be sent to {to_email}")
    # _send_with_retry(message)
    print(f"Successfully 'sent' MOCK OTP email to {to_email}!")


async def send_otp_email(to_email: str, otp_code: str, order_id: int, buyer_name: str = "Student"):
    """Send OTP code to the buyer's email address using SendGrid."""

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

    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=f"🔐 Unimart Delivery Code — Order #{order_id}",
        html_content=html_body,
    )

    print(f"Attempting to send Delivery OTP to {to_email} via SendGrid...")
    _send_with_retry(message)
    print(f"Successfully sent Delivery OTP to {to_email}!")


async def send_transaction_complete_email(to_email: str, order_id: int, product_title: str, seller_name: str = "Seller"):
    """Send transaction completion notification to the seller using SendGrid."""

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

    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=f"✅ Transaction Complete — Order #{order_id}",
        html_content=html_body,
    )

    print(f"Attempting to send Transaction Complete email to {to_email} via SendGrid...")
    _send_with_retry(message)
    print(f"Successfully sent Transaction Complete email to {to_email}!")
