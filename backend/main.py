from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, products, orders, chat, otp, payments, admin
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
    "https://project-phi-pearl-50.vercel.app",  # Vercel production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
