from pydantic import BaseModel, Field
from typing import Optional


class FileItem(BaseModel):
    id: str
    path: str
    filename: str
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    year: Optional[int] = None
    track_number: Optional[int] = None
    genre: Optional[str] = None
    duration: Optional[float] = None  # w sekundach
    bitrate: Optional[int] = None  # w kbps
    format: str
    file_size: int  # w bajtach
    has_cover: bool = False


class FileListRequest(BaseModel):
    offset: int = Field(default=0, ge=0, description="Offset for pagination")
    limit: int = Field(
        default=50, ge=1, le=1000, description="Number of items to fetch"
    )
    search: Optional[str] = Field(
        default=None, description="Search query for title, artist, album, or filename"
    )


class FileListResponse(BaseModel):
    items: list[FileItem]
    total: int
    offset: int = 0
    limit: int = 50
    has_more: bool = False
    search: Optional[str] = None
