from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, products, orders, chat, otp, payments
from scheduler import start_scheduler, stop_scheduler


# ============================================================
# APP LIFESPAN (Startup & Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Create tables and start scheduler
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    print("🚀 Unimart API is ready!")
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
