import asyncio
import os
from services.sendgrid_service import send_registration_otp_email, get_sendgrid_client

async def main():
    print(f"SENDGRID_API_KEY initially present: {bool(os.getenv('SENDGRID_API_KEY'))}")
    print(f"SENDGRID_FROM_EMAIL: {os.getenv('SENDGRID_FROM_EMAIL')}")
    
    # Try getting the client to see if initialization works
    client = get_sendgrid_client()
    if not client:
        print("Failed to initialize SendGrid client.")
        return

    # Use a dummy email that we don't own to simulate sending, or a generic testing email
    test_email = "test.receiver.unimart@yopmail.com"
    print(f"Attempting to send OTP email to {test_email}...")
    
    try:
        await send_registration_otp_email(test_email, "123456", "20124UBCA081")
        print("Email sent successfully! (Check SendGrid console or inbox)")
    except Exception as e:
        print(f"Exception caught in test script: {e}")

if __name__ == "__main__":
    asyncio.run(main())
