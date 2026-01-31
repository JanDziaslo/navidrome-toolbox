from fastapi import APIRouter
from datetime import datetime
from app import get_version

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "navidrome-toolbox-api",
        "version": get_version(),
    }
