"""
Seed script to populate the Official Records (Master Registry) with test data.
Run this once before testing registration: python seed_data.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import OfficialRecord

# Create all tables in the database
Base.metadata.create_all(bind=engine)


def seed_official_records():
    db = SessionLocal()

    # Check if data already exists
    existing = db.query(OfficialRecord).first()
    if existing:
        print("Official records already seeded. Skipping.")
        db.close()
        return

    # Sample official records for testing
    records = [
        OfficialRecord(
            register_number="20124UBCA081",
            full_name="NUMAN KHAN M",
            university="Anna University",
            college="Madras Institute of Technology",
            department="Information Technology",
            official_email="m.numankhan2007@gmail.com"
        ),
        OfficialRecord(
            register_number="2127220501001",
            full_name="ARUN KUMAR S",
            university="Anna University",
            college="Madras Institute of Technology",
            department="Information Technology",
            official_email="arun.it@mitindia.edu"
        ),
        OfficialRecord(
            register_number="2127220501050",
            full_name="PRIYA SHARMA R",
            university="Anna University",
            college="Madras Institute of Technology",
            department="Computer Science",
            official_email="priya.cs@mitindia.edu"
        ),
        OfficialRecord(
            register_number="2127220501075",
            full_name="RAHUL VERMA K",
            university="Anna University",
            college="College of Engineering Guindy",
            department="Mechanical Engineering",
            official_email="rahul.me@ceg.edu"
        ),
        OfficialRecord(
            register_number="2127220501099",
            full_name="DIVYA LAKSHMI P",
            university="Anna University",
            college="College of Engineering Guindy",
            department="Electronics and Communication",
            official_email="divya.ece@ceg.edu"
        ),
    ]

    db.add_all(records)
    db.commit()
    db.close()

    print(f"✅ Successfully seeded {len(records)} official records!")
    print("\nTest register numbers you can use for signup:")
    for r in records:
        print(f"  {r.register_number} — {r.full_name} ({r.department})")


if __name__ == "__main__":
    seed_official_records()
