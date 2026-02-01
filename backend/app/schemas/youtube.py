from pydantic import BaseModel, Field


class VideoResult(BaseModel):
    id: str
    title: str
    duration: int
    uploader: str
    view_count: int
    thumbnail: str
    url: str


class YouTubeSearchResponse(BaseModel):
    results: list[VideoResult]
    count: int
    is_direct_url: bool = Field(
        default=False,
        description="Whether the search was performed on a direct YouTube URL",
    )


class QualityRequest(BaseModel):
    url: str


class FormatInfo(BaseModel):
    format_id: str
    ext: str
    quality: str | None = None
    resolution: str | None = None
    filesize: int | None = None
    audio_codec: str | None = None
    video_codec: str | None = None
    vbr: float | None = None
    abr: float | None = None


class QualityResponse(BaseModel):
    video_id: str
    title: str
    formats: list[FormatInfo]


class DownloadRequest(BaseModel):
    url: str
    format_id: str
    output_template: str = "%(artist, uploader)s - %(title, track)s.%(ext)s"


class DownloadResponse(BaseModel):
    success: bool
    file_path: str
    message: str
