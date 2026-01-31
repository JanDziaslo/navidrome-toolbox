from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import asyncio
import json

from app.schemas.youtube import (
    DownloadRequest,
    DownloadResponse,
    QualityRequest,
    QualityResponse,
    VideoResult,
    YouTubeSearchResponse,
)
from app.services.youtube_service import (
    download,
    download_with_progress,
    get_formats,
    search_youtube,
)

router = APIRouter()


@router.get("/query", response_model=YouTubeSearchResponse)
async def search_videos(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results (1-50)"),
    music_only: bool = Query(True, description="Prefer YouTube Music / topic results"),
):
    try:
        results = search_youtube(q, limit, music_only)
        return YouTubeSearchResponse(results=results, count=len(results))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/formats", response_model=QualityResponse)
async def get_quality(payload: QualityRequest):
    try:
        return get_formats(payload.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download", response_model=DownloadResponse)
async def download_video(payload: DownloadRequest):
    """
    Pobieranie pliku z YouTube na podstawie URL + format_id.
    Zwraca tylko JSON z informacją o powodzeniu i ścieżką pliku.
    """
    try:
        result = download(payload.url, payload.format_id, payload.output_template)
        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download/stream")
async def download_stream(payload: DownloadRequest):
    """
    SSE streaming download progress – idealne pod Next.js.
    Zwraca text/event-stream z kolejnymi eventami progressu.
    """

    async def event_generator():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[dict] = asyncio.Queue()

        def on_progress(data: dict):
            try:
                loop.call_soon_threadsafe(queue.put_nowait, data)
            except Exception:
                pass

        def run_download() -> DownloadResponse:
            return download_with_progress(
                url=payload.url,
                format_id=payload.format_id,
                output_template=payload.output_template,
                progress_cb=on_progress,
            )

        task = loop.run_in_executor(None, run_download)

        while True:
            try:
                progress = await asyncio.wait_for(queue.get(), timeout=0.5)
                yield f"data: {json.dumps(progress)}\n\n"

                if progress.get("status") == "finished":
                    result = await task
                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "status": "complete",
                                "success": result.success,
                                "file": result.file_path,
                            }
                        )
                        + "\n\n"
                    )
                    break

            except asyncio.TimeoutError:
                if task.done():
                    result = await task
                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "status": "complete",
                                "success": result.success,
                                "file": result.file_path,
                            }
                        )
                        + "\n\n"
                    )
                    break
                continue
            except Exception as e:
                yield (
                    "data: "
                    + json.dumps(
                        {
                            "status": "error",
                            "message": str(e),
                        }
                    )
                    + "\n\n"
                )
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
