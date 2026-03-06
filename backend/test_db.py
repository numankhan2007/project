import sys
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import OfficialRecord

DATABASE_URL = "postgresql://postgres:fqXusNULoeJGWectNTGoxmZYnsssteEE@metro.proxy.rlwy.net:18928/railway"

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Check official records
    records = db.query(OfficialRecord).all()
    print(f"Total official records: {len(records)}")
    for r in records[:5]:
        print(f" - {r.register_number}")

except Exception as e:
    print(f"Error: {e}")
