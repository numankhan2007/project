"""
Seed script to populate the Official Records (Master Registry) with test data.
Run this once before testing registration: python seed_data.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import OfficialRecord
import csv

# Create all tables in the database
Base.metadata.create_all(bind=engine)


def seed_official_records():
    db = SessionLocal()

    # Delete existing records to "remove the temporary" data
    db.query(OfficialRecord).delete()
    db.commit()
    print("Cleared existing official records.")

    # Path to the new official database CSV
    csv_path = os.path.join(os.path.dirname(__file__), "official_database.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        db.close()
        return

    records = []
    try:
        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Clean data (remove leading/trailing whitespace from keys and values)
                row = {k.strip(): v.strip() for k, v in row.items()}
                record = OfficialRecord(
                    register_number=row["register_no"],
                    full_name=row["name"],
                    university=row["university"],
                    college=row["college"],
                    department=row["department"],
                    official_email=row["email"]
                )
                records.append(record)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        db.close()
        return

    if records:
        db.add_all(records)
        db.commit()
        print(f"Successfully seeded {len(records)} official records from CSV!")
    else:
        print("No records found in CSV to seed.")

    print("\nTest register numbers you can use for signup:")
    for r in records[:5]: # Show first 5
        print(f"  {r.register_number} -- {r.full_name} ({r.department})")

    db.close()


if __name__ == "__main__":
    seed_official_records()
