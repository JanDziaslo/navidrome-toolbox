from fastapi import FastAPI
from app.routers import health, youtube

app = FastAPI(
    title="Navidrome Toolbox API",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
