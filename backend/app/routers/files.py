import base64
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional

from app.schemas.files import FileItem, FileListRequest, FileListResponse
from app.services.file_service import (
    list_files,
    get_file_by_id,
    get_cover_art,
    get_cover_mime_type,
)

router = APIRouter()


@router.get("", response_model=FileListResponse)
async def get_files(
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=1000, description="Number of items to fetch"),
    search: Optional[str] = Query(
        None, description="Search query for title, artist, album, or filename"
    ),
):
    """
    Get list of music files with pagination and optional search.

    Returns metadata for each file including:
    - Basic info (id, path, filename, format)
    - ID3 tags (title, artist, album, year, track_number, genre)
    - Audio properties (duration, bitrate)
    - Cover art indicator (has_cover)
    """
    try:
        result = list_files(offset=offset, limit=limit, search=search)
        return FileListResponse(
            items=result["items"],
            total=result["total"],
            offset=result["offset"],
            limit=result["limit"],
            has_more=result["has_more"],
            search=result["search"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thumbnail")
async def get_thumbnail(
    path: str = Query(..., description="Base64 encoded full path to the music file"),
):
    """
    Get album cover art from a music file.

    The path parameter should be base64 encoded to handle special characters.
    Returns the embedded cover image (JPEG/PNG) with proper Content-Type.
    Returns 404 if no cover art is found in the file.
    """
    try:
        # Decode path from base64
        try:
            decoded_path = base64.b64decode(path).decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 encoded path")

        cover_data = get_cover_art(decoded_path)

        if not cover_data:
            raise HTTPException(status_code=404, detail="No cover art found in file")

        mime_type = get_cover_mime_type(decoded_path)

        return StreamingResponse(
            iter([cover_data]),
            media_type=mime_type,
            headers={
                "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                "Content-Length": str(len(cover_data)),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}", response_model=FileItem)
async def get_file(file_id: str):
    """
    Get a single music file by ID.

    Returns detailed metadata for the specified file.
    Returns 404 if file is not found.
    """
    try:
        file = get_file_by_id(file_id)

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        return FileItem(**file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
