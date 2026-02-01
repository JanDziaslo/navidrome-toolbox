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


def _is_youtube_url(query: str) -> bool:
    """
    Check if the query is a YouTube URL.
    Supports: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...
    """
    import re

    youtube_pattern = (
        r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/)|youtu\.be/)"
    )
    return bool(re.match(youtube_pattern, query))


def _is_playlist_url(query: str) -> bool:
    """
    Check if the query is a YouTube playlist URL.
    Supports: youtube.com/playlist?list=..., youtube.com/watch?v=...&list=...
    """
    import re

    playlist_pattern = (
        r"^(https?://)?(www\.)?(youtube\.com/.*[?&]list=|youtube\.com/playlist\?)"
    )
    return bool(re.match(playlist_pattern, query))


def _extract_playlist_id(url: str) -> str | None:
    """Extract playlist ID from URL."""
    import re

    match = re.search(r"[?&]list=([^&]+)", url)
    return match.group(1) if match else None


def _convert_to_playlist_url(url: str) -> str:
    """Convert watch URL with list parameter to proper playlist URL."""
    if _is_playlist_url(url) and "watch?" in url:
        playlist_id = _extract_playlist_id(url)
        if playlist_id:
            return f"https://www.youtube.com/playlist?list={playlist_id}"
    return url


def _extract_single_video(entry: dict) -> VideoResult | None:
    """
    Extract a single video result from a yt-dlp entry.
    """
    if not entry:
        return None

    video_id = entry.get("id")
    if not video_id:
        return None

    uploader = entry.get("artist") or entry.get("uploader") or entry.get("channel", "")

    # yt-dlp w extract_flat często nie daje thumbnaila, więc budujemy go sami
    thumbnail = (
        entry.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
    )

    url = entry.get(
        "webpage_url",
        entry.get("url", f"https://www.youtube.com/watch?v={video_id}"),
    )

    view_count = entry.get("view_count", 0) or 0
    duration = entry.get("duration", 0) or 0

    return VideoResult(
        id=video_id,
        title=entry.get("title", ""),
        duration=duration,
        uploader=uploader,
        view_count=view_count,
        thumbnail=thumbnail,
        url=url,
    )


def search_youtube(
    query: str, limit: int, music_only: bool = True
) -> tuple[list[VideoResult], bool]:
    """
    Search YouTube or extract info from a direct URL.

    Returns:
        tuple: (results, is_direct_url)
            - results: list of VideoResult
            - is_direct_url: True if query was a direct YouTube URL, False if it was a search
    """
    if not 1 <= limit <= 50:
        raise ValueError("Limit must be between 1 and 50")

    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    ydl_opts: dict = {
        "quiet": True,
        "noplaylist": True,
        "skip_download": True,
    }

    if cookie_file and Path(cookie_file).is_file():
        ydl_opts["cookiefile"] = cookie_file

    is_direct_url = _is_youtube_url(query)

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            if is_direct_url:
                # Pobieranie informacji o filmie bezpośrednio z URL'a
                ydl_opts["extract_flat"] = False
                info_dict = ydl.extract_info(query, download=False)
            else:
                # Wyszukiwanie po frażie
                ydl_opts["extract_flat"] = True
                search_suffix = " topic audio" if music_only else ""
                search_term = f"ytsearch{limit}:{query}{search_suffix}"
                info_dict = ydl.extract_info(search_term, download=False)

    except (yt_dlp.utils.DownloadError, yt_dlp.utils.ExtractorError) as e:
        raise Exception(f"yt-dlp error: {str(e)}")
    except Exception as e:
        raise Exception(f"Network error: {str(e)}")

    results: list[VideoResult] = []

    if is_direct_url:
        # Jeśli to bezpośredni URL, może to być playlist
        if "entries" in info_dict:
            # Playlist lub seria filmów
            entries = info_dict.get("entries") or []
            for entry in entries[:limit]:  # Ograniczyć do limit
                video = _extract_single_video(entry)
                if video:
                    results.append(video)
        else:
            # Pojedynczy film
            video = _extract_single_video(info_dict)
            if video:
                results.append(video)
    else:
        # Wyniki wyszukiwania
        entries = info_dict.get("entries") or []
        for entry in entries:
            video = _extract_single_video(entry)
            if video:
                results.append(video)

    return results, is_direct_url


def get_playlist_info(url: str) -> dict:
    """
    Fetch full playlist information including all videos.
    Returns playlist metadata and list of VideoResult.
    """
    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    ydl_opts: dict = {
        "quiet": True,
        "extract_flat": True,  # Fast extraction - only gets basic info without resolving each video
        "skip_download": True,
        "playlist_items": "1-100",  # Limit to first 100 items for speed
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

    # Debug logging
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"Playlist info keys: {list(info.keys()) if info else 'None'}")
    logger.info(f"Is playlist? {'entries' in info if info else False}")
    if info and "entries" in info:
        logger.info(
            f"Number of entries: {len(info['entries']) if info['entries'] else 0}"
        )

    # Extract playlist metadata
    playlist_title = info.get("title", "Unknown Playlist")
    playlist_uploader = info.get("uploader") or info.get("channel", "")
    playlist_thumbnail = info.get("thumbnail", "")

    # Extract all videos
    entries = info.get("entries") or []
    videos: list[VideoResult] = []

    # If no entries found but we have an ID, this might be a single video
    # Check if this is actually a playlist URL
    if not entries and _is_playlist_url(url):
        # Try again without extract_flat to get full playlist info
        ydl_opts_full = {
            "quiet": True,
            "skip_download": True,
        }
        if cookie_file and Path(cookie_file).is_file():
            ydl_opts_full["cookiefile"] = cookie_file

        try:
            with yt_dlp.YoutubeDL(ydl_opts_full) as ydl_full:
                info_full = ydl_full.extract_info(url, download=False)
            if info_full and "entries" in info_full:
                entries = info_full.get("entries") or []
                playlist_title = info_full.get("title", playlist_title)
                playlist_uploader = info_full.get("uploader") or playlist_uploader
                playlist_thumbnail = info_full.get("thumbnail", playlist_thumbnail)
        except Exception as e:
            logger.error(f"Retry with full extraction failed: {e}")

    for entry in entries:
        video = _extract_single_video(entry)
        if video:
            videos.append(video)

    return {
        "title": playlist_title,
        "uploader": playlist_uploader,
        "thumbnail": playlist_thumbnail,
        "video_count": len(videos),
        "videos": videos,
        "playlist_url": url,
    }


def get_playlist_info_chunked(url: str, offset: int = 0, limit: int = 10) -> dict:
    """
    Fetch playlist videos in chunks with parallel processing.
    Returns playlist metadata and a chunk of videos starting from offset.
    """
    cookie_file = os.getenv("YTDLP_COOKIE_FILE", "")

    # Convert URL to proper playlist format for faster extraction
    playlist_url = _convert_to_playlist_url(url)
    print(f"DEBUG: Original URL: {url}")
    print(f"DEBUG: Converted URL: {playlist_url}")

    # Calculate playlist item range (1-indexed for yt-dlp)
    start_item = offset + 1
    end_item = offset + limit

    ydl_opts: dict = {
        "quiet": True,
        "skip_download": True,
        "playlist_items": f"{start_item}-{end_item}",  # Get specific range
        "extract_flat": True,  # Fast extraction - only basic info
    }

    if cookie_file and Path(cookie_file).is_file():
        ydl_opts["cookiefile"] = cookie_file

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
    except (yt_dlp.utils.DownloadError, yt_dlp.utils.ExtractorError) as e:
        raise Exception(f"yt-dlp error: {str(e)}")
    except Exception as e:
        raise Exception(f"Network error: {str(e)}")

    # Debug logging - using print for immediate console output
    print(
        f"DEBUG Chunk: playlist_url={playlist_url}, offset={offset}, limit={limit}",
        flush=True,
    )
    print(f"DEBUG Info keys: {list(info.keys()) if info else 'None'}", flush=True)
    print(
        f"DEBUG Playlist count: {info.get('playlist_count') if info else 'N/A'}",
        flush=True,
    )

    # Extract playlist metadata (from first request or reuse from client)
    playlist_title = info.get("title", "Unknown Playlist")
    playlist_uploader = info.get("uploader") or info.get("channel", "")
    playlist_thumbnail = info.get("thumbnail", "")
    total_entries = info.get("playlist_count") or 0

    # Extract videos from this chunk
    entries = info.get("entries") or []
    print(f"DEBUG Entries count: {len(entries)}", flush=True)
    if entries:
        print(f"DEBUG First entry sample: {str(entries[0])[:200]}", flush=True)
    videos: list[VideoResult] = []

    # Process entries in parallel batches of 5
    if entries:
        from concurrent.futures import ThreadPoolExecutor, as_completed

        def process_entry(entry: dict) -> VideoResult | None:
            try:
                return _extract_single_video(entry)
            except Exception:
                return None

        # Process in parallel with max 5 workers
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_entry = {
                executor.submit(process_entry, entry): entry for entry in entries
            }

            for future in as_completed(future_to_entry):
                video = future.result()
                if video:
                    videos.append(video)

    # Sort videos by original order (since parallel processing may mix order)
    videos.sort(
        key=lambda v: next((i for i, e in enumerate(entries) if e.get("id") == v.id), 0)
    )

    return {
        "title": playlist_title,
        "uploader": playlist_uploader,
        "thumbnail": playlist_thumbnail,
        "video_count": len(videos),
        "total_count": total_entries,
        "videos": videos,
        "playlist_url": url,
        "offset": offset,
        "limit": limit,
        "has_more": total_entries > end_item
        if total_entries
        else len(entries) == limit,
    }


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
    if ".." in output_template or "/" in output_template or "\\" in output_template:
        return DownloadResponse(
            success=False,
            file_path="",
            message="Invalid filename: path traversal not allowed",
        )
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
        # Change .webm extension to .opus for audio-only formats
        if final_path.endswith(".webm"):
            new_path = final_path[:-5] + ".opus"
            os.rename(final_path, new_path)
            final_path = new_path
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
    if ".." in output_template or "/" in output_template or "\\" in output_template:
        return DownloadResponse(
            success=False,
            file_path="",
            message="Invalid filename: path traversal not allowed",
        )
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

        # Change .webm extension to .opus for audio-only formats
        if file_path.endswith(".webm"):
            new_path = file_path[:-5] + ".opus"
            os.rename(file_path, new_path)
            file_path = new_path

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
