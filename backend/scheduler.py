"""
Background Scheduler for automated cleanup tasks.
Uses APScheduler to run periodic jobs.

Tasks:
1. Delete SOLD_OUT products older than 7 days (runs every 24 hours)
2. Delete chat messages for completed orders older than 24 hours
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from database import SessionLocal
from models import Product, ChatMessage, Order, ProductStatus, OrderStatus


def cleanup_sold_out_products():
    """
    Delete products that have been in SOLD_OUT status for more than 7 days.
    Runs every 24 hours.
    """
    db: Session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        sold_products = db.query(Product).filter(
            Product.product_status == ProductStatus.SOLD_OUT,
            Product.sold_at != None,
            Product.sold_at < cutoff
        ).all()

        count = len(sold_products)
        for product in sold_products:
            db.delete(product)

        db.commit()

        if count > 0:
            print(f"[SCHEDULER] ✅ Deleted {count} sold-out products older than 7 days.")
        else:
            print(f"[SCHEDULER] No sold-out products to clean up.")

    except Exception as e:
        print(f"[SCHEDULER] ❌ Error in cleanup job: {e}")
        db.rollback()
    finally:
        db.close()


def cleanup_expired_chats():
    """
    Delete chat messages for orders that were completed more than 24 hours ago.
    This implements the "chat disappears 24h after completion" requirement.
    """
    db: Session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        # Find completed orders older than 24 hours
        expired_orders = db.query(Order).filter(
            Order.order_status == OrderStatus.COMPLETED,
            Order.completed_at != None,
            Order.completed_at < cutoff
        ).all()

        total_deleted = 0
        for order in expired_orders:
            messages = db.query(ChatMessage).filter(
                ChatMessage.order_id == order.id
            ).all()

            for msg in messages:
                db.delete(msg)
                total_deleted += 1

        db.commit()

        if total_deleted > 0:
            print(f"[SCHEDULER] ✅ Deleted {total_deleted} expired chat messages from {len(expired_orders)} completed orders.")
        else:
            print(f"[SCHEDULER] No expired chat messages to clean up.")

    except Exception as e:
        print(f"[SCHEDULER] ❌ Error in chat cleanup job: {e}")
        db.rollback()
    finally:
        db.close()


# ============================================================
# SCHEDULER INITIALIZATION
# ============================================================

scheduler = BackgroundScheduler()


def start_scheduler():
    """Start the background scheduler with all cleanup jobs."""

    # Run product cleanup every 24 hours
    scheduler.add_job(
        cleanup_sold_out_products,
        trigger=IntervalTrigger(hours=24),
        id="cleanup_sold_out_products",
        name="Delete SOLD_OUT products older than 7 days",
        replace_existing=True,
    )

    # Run chat cleanup every 1 hour
    scheduler.add_job(
        cleanup_expired_chats,
        trigger=IntervalTrigger(hours=1),
        id="cleanup_expired_chats",
        name="Delete chat messages from completed orders (24h expiry)",
        replace_existing=True,
    )

    scheduler.start()
    print("[SCHEDULER] 🕐 Background scheduler started.")
    print("[SCHEDULER]   - Product cleanup: every 24 hours")
    print("[SCHEDULER]   - Chat cleanup: every 1 hour")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print("[SCHEDULER] Scheduler stopped.")
