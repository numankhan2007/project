import os
import redis
from dotenv import load_dotenv

load_dotenv()

# Redis connection — defaults to localhost for local development
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create a connection pool to handle multiple concurrent requests
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, health_check_interval=30)
    # Test connection
    redis_client.ping()
    print("Successfully connected to Redis.")
except redis.ConnectionError as e:
    print(f"Failed to connect to Redis at {REDIS_URL}: {e}")
    # We allow the app to run without Redis strictly for very early local dev, 
    # but auth endpoints won't work correctly without it.
    redis_client = None
