import os
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
from dotenv import load_dotenv

load_dotenv()
database_url = os.getenv("DATABASE_URL")

engine = create_engine(database_url)
if not database_exists(engine.url):
    print("Database does not exist. Creating...")
    create_database(engine.url)
    print("Database created successfully!")
else:
    print("Database already exists. Connection successful!")

from sqlalchemy import inspect
inspector = inspect(engine)
print("Tables in DB:", inspector.get_table_names())
