from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import connect_to_database, close_database_connection
from app.api.routes import auth, bins, fleet, analytics, alerts, citizens, zones


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_database()
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} is running!")
    yield
    # Shutdown
    await close_database_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Smart Waste Management Platform — Real-time bin monitoring, route optimization, predictive analytics, and citizen engagement.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api")
app.include_router(bins.router, prefix="/api")
app.include_router(fleet.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(citizens.router, prefix="/api")
app.include_router(zones.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "description": "Smart Waste Management API"
    }


@app.get("/health")
async def health_check():
    from app.core.database import get_database
    db = get_database()
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "version": settings.APP_VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
