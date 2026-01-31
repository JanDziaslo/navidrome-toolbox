import os
from pathlib import Path
import tempfile
from typing import Callable, Optional

import yt_dlp
import yt_dlp.utils
from app.schemas.youtube import (
    DownloadResponse,
    FormatInfo,
    QualityResponse,
    VideoResult,
)


def search_youtube(
    query: str, limit: int, music_only: bool = True
) -> list[VideoResult]:
    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50")

    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    ydl_opts: dict = {
        "quiet": True,
        "noplaylist": True,
        "extract_flat": True,
        "skip_download": True,
    }

    if cookie_file and Path(cookie_file).is_file():
        # yt-dlp Python API – odpowiednik --cookies FILE
        ydl_opts["cookiefile"] = cookie_file  # [web:78]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_suffix = " topic audio" if music_only else ""
            search_term = f"ytsearch{limit}:{query}{search_suffix}"
            info_dict = ydl.extract_info(search_term, download=False)

    except (yt_dlp.utils.DownloadError, yt_dlp.utils.ExtractorError) as e:
        raise Exception(f"yt-dlp error: {str(e)}")

    except Exception as e:
        raise Exception(f"Network error: {str(e)}")

    entries = info_dict.get("entries") or []
    results: list[VideoResult] = []

    for entry in entries:
        if not entry:
            continue

        video_id = entry.get("id")
        if not video_id:
            continue

        uploader = (
            entry.get("artist") or entry.get("uploader") or entry.get("channel", "")
        )

        # yt-dlp w extract_flat często nie daje thumbnaila, więc budujemy go sami
        thumbnail = (
            entry.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
        )  # [web:107]

        url = entry.get(
            "webpage_url",
            entry.get("url", f"https://www.youtube.com/watch?v={video_id}"),
        )

        view_count = entry.get("view_count", 0) or 0
        duration = entry.get("duration", 0) or 0

        results.append(
            VideoResult(
                id=video_id,
                title=entry.get("title", ""),
                duration=duration,
                uploader=uploader,
                view_count=view_count,
                thumbnail=thumbnail,
                url=url,
            )
        )

    return results


def get_formats(url: str) -> QualityResponse:
    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    ydl_opts: dict = {
        "quiet": True,
        "noplaylist": True,
        "extract_flat": False,
        "skip_download": True,
    }

    if cookie_file and Path(cookie_file).is_file():
        ydl_opts["cookiefile"] = cookie_file

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except (yt_dlp.utils.DownloadError, yt_dlp.utils.ExtractorError) as e:
        raise Exception(f"yt-dlp error: {str(e)}")
    except Exception as e:
        raise Exception(f"Network error: {str(e)}")

    if "entries" in info:
        info = info["entries"][0] if info["entries"] else {}

    formats_raw = info.get("formats", []) or []
    formats: list[FormatInfo] = []

    for f in formats_raw:
        vcodec = f.get("vcodec")
        acodec = f.get("acodec")

        is_audio_only = (vcodec in ("none", None)) and acodec not in (None, "none")
        if not is_audio_only:
            continue

        formats.append(
            FormatInfo(
                format_id=f.get("format_id", ""),
                ext=f.get("ext", ""),
                quality=f.get("format_note") or "audio only",
                resolution=f.get("resolution"),
                filesize=f.get("filesize") or f.get("filesize_approx"),
                audio_codec=acodec,
                video_codec=vcodec,
                vbr=f.get("vbr"),
                abr=f.get("abr"),
            )
        )

    formats.sort(key=lambda x: x.abr or 0, reverse=True)

    return QualityResponse(
        video_id=info.get("id", ""),
        title=info.get("title", ""),
        formats=formats,
    )


def download(url: str, format_id: str, output_template: str) -> DownloadResponse:
    tmp_dir = tempfile.mkdtemp()
    outtmpl = os.path.join(tmp_dir, output_template)

    ydl_opts: dict = {
        "quiet": True,
        "noplaylist": True,
        "format": format_id,
        "outtmpl": outtmpl,
        "skip_download": False,
    }

    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")
    if cookie_file and Path(cookie_file).is_file():
        ydl_opts["cookiefile"] = cookie_file

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            final_path = ydl.prepare_filename(info)
        return DownloadResponse(
            success=True, file_path=final_path, message="Downloaded successfully"
        )
    except Exception as e:
        return DownloadResponse(success=False, file_path="", message=str(e))


def download_with_progress(
    url: str,
    format_id: str,
    output_template: str,
    progress_cb: Optional[Callable[[dict], None]] = None,
) -> DownloadResponse:
    """
    Synchronous download using yt-dlp with optional progress callback.
    progress_cb dostaje słowniki typu:
      {"status": "downloading", "downloaded": ..., "total": ..., "speed": ..., "eta": ..., "percent": ...}
      {"status": "finished", "filename": "..."}
    """
    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    tmp_dir = tempfile.mkdtemp(prefix="yt_")
    outtmpl = os.path.join(tmp_dir, output_template)

    def build_opts() -> dict:
        opts: dict = {
            "quiet": True,
            "noplaylist": True,
            "format": format_id,
            "outtmpl": outtmpl,
            "skip_download": False,
        }

        if cookie_file and Path(cookie_file).is_file():
            opts["cookiefile"] = cookie_file

        if progress_cb:

            def hook(d: dict):
                status = d.get("status")
                if status == "downloading":
                    downloaded = d.get("downloaded_bytes", 0) or 0
                    total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    speed = d.get("speed", 0) or 0
                    eta = d.get("eta", 0) or 0
                    percent = (downloaded / total * 100) if total else 0.0

                    progress_cb(
                        {
                            "status": "downloading",
                            "downloaded": downloaded,
                            "total": total,
                            "speed": speed,
                            "eta": eta,
                            "percent": percent,
                        }
                    )
                elif status == "finished":
                    progress_cb(
                        {
                            "status": "finished",
                            "filename": d.get("filename", ""),
                        }
                    )

            opts["progress_hooks"] = [hook]

        return opts

    try:
        opts = build_opts()
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)

        return DownloadResponse(
            success=True,
            file_path=file_path,
            message="Downloaded successfully",
        )
    except Exception as e:
        return DownloadResponse(
            success=False,
            file_path="",
            message=str(e),
        )
