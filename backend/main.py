from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, products, orders, chat, otp, payments
from scheduler import start_scheduler, stop_scheduler
from seed_data import seed_official_records


# ============================================================
# APP LIFESPAN (Startup & Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Create tables and start scheduler
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    
    # Auto-seed official records if empty (workaround for lack of Render shell access)
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
# CORS MIDDLEWARE (Allow React frontend)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://numankhan2007.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REGISTER ALL ROUTERS (under /api prefix)
# ============================================================

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(otp.router, prefix="/api")
app.include_router(payments.router, prefix="/api")


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

@app.get("/api/seed-records")
def manual_seed():
    """Temporary endpoint to seed official records since Render free tier lacks shell access."""
    try:
        seed_official_records()
        return {"status": "success", "message": "Official records seeded successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
