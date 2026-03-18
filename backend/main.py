from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import redis
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import UserProfile
from routers import auth, products, orders, chat, otp, admin
from scheduler import start_scheduler, stop_scheduler
from seed_data import seed_official_records


# ============================================================
# APP LIFESPAN (Startup & Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Start scheduler
    start_scheduler()
    
    # Auto-seed official records if empty
    try:
        seed_official_records()
        print("Database seeding check completed.")
    except Exception as e:
        print(f"Error during auto-seeding: {e}")
        
    print("Unimart API is ready!")
    yield
    # SHUTDOWN: Stop scheduler
    stop_scheduler()


# ============================================================
# APP INITIALIZATION
# ============================================================

app = FastAPI(
    title="Unimart API",
    description="Secure Student-to-Student Marketplace Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================
# CORS MIDDLEWARE (Restrict to known origins)
# ============================================================

ALLOWED_ORIGINS = [
    "http://localhost:5173",                    # Local Vite dev server
    "http://localhost:3000",                    # Alternative local dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# EXCEPTION HANDLERS (To preserve CORS on unhandled exceptions)
# ============================================================

@app.exception_handler(redis.RedisError)
async def redis_exception_handler(request: Request, exc: redis.RedisError):
    print(f"Redis Exception Caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Cache/Database connection failed. Please try again later."},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception Caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please contact support."},
    )

# ============================================================
# REGISTER ALL ROUTERS (under /api prefix)
# ============================================================

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(otp.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


# ============================================================
# ROOT ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "app": "Unimart API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    student_count = db.query(UserProfile).count()
    return {"registeredStudents": student_count}
