import os
import hashlib
from pathlib import Path
from typing import Optional
from mutagen.mp3 import MP3
from mutagen.flac import FLAC, Picture
from mutagen.mp4 import MP4
from mutagen.oggvorbis import OggVorbis
from mutagen.oggopus import OggOpus
from mutagen.asf import ASF
from mutagen.wave import WAVE

# Obsługiwane formaty audio
SUPPORTED_EXTENSIONS = {
    ".mp3",
    ".flac",
    ".m4a",
    ".aac",
    ".ogg",
    ".opus",
    ".wma",
    ".wav",
}

# Ścieżka do katalogu z muzyką (konfigurowalna przez zmienną środowiskową)
MUSIC_DIR = os.environ.get("MUSIC_DIR", "/media")


def get_file_id(file_path: str) -> str:
    """Generuje unikalny ID na podstawie ścieżki pliku."""
    return hashlib.sha256(file_path.encode()).hexdigest()[:16]


def scan_music_directory(directory: str = MUSIC_DIR) -> list[str]:
    """
    Rekursywnie skanuje katalog w poszukiwaniu plików muzycznych.
    Zwraca listę ścieżek do plików.
    """
    music_files: list[str] = []

    if not os.path.exists(directory):
        return music_files

    for root, _, files in os.walk(directory):
        for file in files:
            file_lower = file.lower()
            if any(file_lower.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                full_path = os.path.join(root, file)
                music_files.append(full_path)

    # Sortuj alfabetycznie dla deterministycznej kolejności
    music_files.sort()
    return music_files


def _safe_get_first(value) -> Optional[str]:
    """Bezpiecznie pobiera pierwszy element z listy lub zwraca None."""
    if value is None:
        return None
    if isinstance(value, list) and len(value) > 0:
        result = value[0]
        return str(result) if result is not None else None
    if isinstance(value, str):
        return value
    return None


def _safe_get_first_tuple(value) -> Optional[tuple]:
    """Bezpiecznie pobiera pierwszy element z listy krotek lub zwraca None."""
    if value is None:
        return None
    if isinstance(value, list) and len(value) > 0:
        return value[0]
    return None


def extract_metadata(file_path: str) -> dict:
    """
    Wyciąga metadane z pliku audio używając mutagen.
    Zwraca słownik z metadanymi.
    """
    metadata = {
        "title": None,
        "artist": None,
        "album": None,
        "year": None,
        "track_number": None,
        "genre": None,
        "duration": None,
        "bitrate": None,
        "format": None,
        "file_size": os.path.getsize(file_path),
        "has_cover": False,
    }

    try:
        ext = Path(file_path).suffix.lower()
        metadata["format"] = ext.lstrip(".")

        audio = None

        if ext == ".mp3":
            audio = MP3(file_path)
            # Sprawdź czy są tagi ID3
            if audio.tags:
                id3 = audio.tags
                tit2 = id3.get("TIT2")
                metadata["title"] = str(tit2) if tit2 is not None else None
                tpe1 = id3.get("TPE1")
                metadata["artist"] = str(tpe1) if tpe1 is not None else None
                talb = id3.get("TALB")
                metadata["album"] = str(talb) if talb is not None else None
                tcon = id3.get("TCON")
                metadata["genre"] = str(tcon) if tcon is not None else None

                # Rok z tagu TDRC (ID3v2.4) lub TYER (ID3v2.3)
                year_tag = id3.get("TDRC") or id3.get("TYER")
                if year_tag:
                    try:
                        metadata["year"] = int(str(year_tag)[:4])
                    except ValueError:
                        pass

                # Numer utworu
                track_tag = id3.get("TRCK")
                if track_tag:
                    try:
                        track_str = str(track_tag).split("/")[0]
                        metadata["track_number"] = int(track_str)
                    except ValueError:
                        pass

                # Sprawdź czy jest okładka (APIC frame)
                for key in id3.keys():
                    if key.startswith("APIC:"):
                        metadata["has_cover"] = True
                        break

        elif ext == ".flac":
            audio = FLAC(file_path)
            metadata["title"] = _safe_get_first(audio.get("title"))
            metadata["artist"] = _safe_get_first(audio.get("artist"))
            metadata["album"] = _safe_get_first(audio.get("album"))
            metadata["year"] = _parse_year(_safe_get_first(audio.get("date")))
            metadata["track_number"] = _parse_track_number(
                _safe_get_first(audio.get("tracknumber"))
            )
            metadata["genre"] = _safe_get_first(audio.get("genre"))
            metadata["has_cover"] = len(audio.pictures) > 0

        elif ext in [".m4a", ".aac"]:
            audio = MP4(file_path)
            # MP4 używa innych kluczy
            metadata["title"] = _safe_get_first(audio.get("\xa9nam"))
            metadata["artist"] = _safe_get_first(audio.get("\xa9ART"))
            metadata["album"] = _safe_get_first(audio.get("\xa9alb"))
            metadata["year"] = _parse_year(_safe_get_first(audio.get("\xa9day")))
            # trkn to lista krotek (numer, całkowita_liczba)
            trkn_list = audio.get("trkn")
            if trkn_list and len(trkn_list) > 0:
                metadata["track_number"] = _parse_track_number(trkn_list[0][0])
            metadata["genre"] = _safe_get_first(audio.get("\xa9gen"))
            # Okładka w MP4
            if "covr" in audio:
                metadata["has_cover"] = len(audio["covr"]) > 0

        elif ext == ".ogg":
            audio = OggVorbis(file_path)
            metadata["title"] = _safe_get_first(audio.get("title"))
            metadata["artist"] = _safe_get_first(audio.get("artist"))
            metadata["album"] = _safe_get_first(audio.get("album"))
            metadata["year"] = _parse_year(_safe_get_first(audio.get("date")))
            metadata["track_number"] = _parse_track_number(
                _safe_get_first(audio.get("tracknumber"))
            )
            metadata["genre"] = _safe_get_first(audio.get("genre"))
            # Check for cover art in METADATA_BLOCK_PICTURE tag
            if audio.tags:
                metadata["has_cover"] = (
                    audio.tags.get("METADATA_BLOCK_PICTURE") is not None
                )

        elif ext == ".opus":
            audio = OggOpus(file_path)
            metadata["title"] = _safe_get_first(audio.get("title"))
            metadata["artist"] = _safe_get_first(audio.get("artist"))
            metadata["album"] = _safe_get_first(audio.get("album"))
            metadata["year"] = _parse_year(_safe_get_first(audio.get("date")))
            metadata["track_number"] = _parse_track_number(
                _safe_get_first(audio.get("tracknumber"))
            )
            metadata["genre"] = _safe_get_first(audio.get("genre"))
            # Check for cover art in METADATA_BLOCK_PICTURE tag
            if audio.tags:
                metadata["has_cover"] = (
                    audio.tags.get("METADATA_BLOCK_PICTURE") is not None
                )

        elif ext == ".wma":
            audio = ASF(file_path)
            wm_title = _safe_get_first(audio.get("WM/Title"))
            title = _safe_get_first(audio.get("Title"))
            metadata["title"] = wm_title or title

            wm_author = _safe_get_first(audio.get("WM/Author"))
            author = _safe_get_first(audio.get("Author"))
            metadata["artist"] = wm_author or author

            metadata["album"] = _safe_get_first(audio.get("WM/AlbumTitle"))
            metadata["year"] = _parse_year(_safe_get_first(audio.get("WM/Year")))
            metadata["track_number"] = _parse_track_number(
                _safe_get_first(audio.get("WM/TrackNumber"))
            )
            metadata["genre"] = _safe_get_first(audio.get("WM/Genre"))

        elif ext == ".wav":
            audio = WAVE(file_path)
            # WAV ma ograniczone metadane

        # Wspólne pola dla wszystkich formatów
        if audio and hasattr(audio, "info") and audio.info is not None:
            info = audio.info
            if hasattr(info, "length") and info.length is not None:
                metadata["duration"] = float(info.length)
            # bitrate może nie być dostępny we wszystkich formatach
            bitrate = getattr(info, "bitrate", None)
            if bitrate is not None:
                metadata["bitrate"] = int(bitrate / 1000)  # konwersja na kbps
            # Dla formatów Ogg (Opus, Vorbis) bitrate może być obliczone
            elif (
                ext in [".opus", ".ogg"]
                and metadata["duration"]
                and metadata["duration"] > 0
            ):
                # Oblicz bitrate z rozmiaru pliku i długości
                # Ogg header to zazwyczaj około 100-500 bajtów
                audio_data_size = metadata["file_size"] - 500  # Przybliżenie
                if audio_data_size > 0:
                    calculated_bitrate = int(
                        (audio_data_size * 8) / metadata["duration"] / 1000
                    )
                    if calculated_bitrate > 0:
                        metadata["bitrate"] = calculated_bitrate

    except Exception:
        # W przypadku błędu parsowania zwracamy podstawowe metadane
        pass

    return metadata


def _parse_year(year_str: Optional[str]) -> Optional[int]:
    """Parsuje rok z stringa."""
    if not year_str:
        return None
    try:
        return int(str(year_str)[:4])
    except (ValueError, TypeError):
        return None


def _parse_track_number(track_value) -> Optional[int]:
    """Parsuje numer utworu z różnych formatów (string '1/10' lub int)."""
    if track_value is None:
        return None
    try:
        if isinstance(track_value, int):
            return track_value
        track_str = str(track_value).split("/")[0]
        return int(track_str)
    except (ValueError, TypeError):
        return None


def get_cover_art(file_path: str) -> Optional[bytes]:
    """
    Wyciąga okładkę z pliku audio.
    Zwraca bajty obrazu lub None jeśli brak okładki.
    """
    try:
        ext = Path(file_path).suffix.lower()

        if ext == ".mp3":
            audio = MP3(file_path)
            if audio.tags:
                for key in audio.tags.keys():
                    if key.startswith("APIC:"):
                        apic = audio.tags[key]
                        return apic.data

        elif ext == ".flac":
            audio = FLAC(file_path)
            if audio.pictures:
                return audio.pictures[0].data

        elif ext in [".m4a", ".aac"]:
            audio = MP4(file_path)
            if "covr" in audio and audio["covr"]:
                return bytes(audio["covr"][0])

        elif ext == ".opus":
            audio = OggOpus(file_path)
            # OggOpus stores cover art as base64-encoded FLAC Picture block in METADATA_BLOCK_PICTURE tag
            if audio.tags:
                pictures = audio.tags.get("METADATA_BLOCK_PICTURE")
                if pictures:
                    import base64

                    try:
                        picture_data = base64.b64decode(pictures[0])
                        picture = Picture(picture_data)
                        return picture.data
                    except Exception:
                        pass

        elif ext == ".ogg":
            audio = OggVorbis(file_path)
            # OggVorbis stores cover art as base64-encoded FLAC Picture block in METADATA_BLOCK_PICTURE tag
            if audio.tags:
                pictures = audio.tags.get("METADATA_BLOCK_PICTURE")
                if pictures:
                    import base64

                    try:
                        picture_data = base64.b64decode(pictures[0])
                        picture = Picture(picture_data)
                        return picture.data
                    except Exception:
                        pass

    except Exception:
        pass

    return None


def get_cover_mime_type(file_path: str) -> str:
    """
    Zwraca MIME type okładki na podstawie formatu.
    """
    try:
        ext = Path(file_path).suffix.lower()

        if ext == ".mp3":
            audio = MP3(file_path)
            if audio.tags:
                for key in audio.tags.keys():
                    if key.startswith("APIC:"):
                        apic = audio.tags[key]
                        return apic.mime

        elif ext == ".flac":
            audio = FLAC(file_path)
            if audio.pictures:
                mime = audio.pictures[0].mime
                return mime if mime else "image/jpeg"

        elif ext in [".m4a", ".aac"]:
            audio = MP4(file_path)
            if "covr" in audio and audio["covr"]:
                # MP4 używa formatów: 0=jpeg, 1=png
                covr_data = bytes(audio["covr"][0])
                if len(covr_data) > 4:
                    # Sprawdź magic bytes PNG
                    if covr_data[:4] == b"\x89PNG":
                        return "image/png"
                return "image/jpeg"

        elif ext == ".opus":
            audio = OggOpus(file_path)
            if audio.tags:
                pictures = audio.tags.get("METADATA_BLOCK_PICTURE")
                if pictures:
                    import base64

                    try:
                        picture_data = base64.b64decode(pictures[0])
                        picture = Picture(picture_data)
                        mime = picture.mime
                        return mime if mime else "image/jpeg"
                    except Exception:
                        pass

        elif ext == ".ogg":
            audio = OggVorbis(file_path)
            if audio.tags:
                pictures = audio.tags.get("METADATA_BLOCK_PICTURE")
                if pictures:
                    import base64

                    try:
                        picture_data = base64.b64decode(pictures[0])
                        picture = Picture(picture_data)
                        mime = picture.mime
                        return mime if mime else "image/jpeg"
                    except Exception:
                        pass

    except Exception:
        pass

    return "image/jpeg"  # domyślnie


def list_files(offset: int = 0, limit: int = 50, search: Optional[str] = None) -> dict:
    """
    Zwraca listę plików z paginacją i opcjonalnym wyszukiwaniem.
    """
    # Pobierz wszystkie ścieżki plików
    all_files = scan_music_directory()

    # Filtrowanie po wyszukiwaniu
    if search:
        search_lower = search.lower()
        filtered_files = []
        for file_path in all_files:
            # Pobierz metadane dla wyszukiwania
            metadata = extract_metadata(file_path)
            searchable_text = " ".join(
                filter(
                    None,
                    [
                        metadata.get("title"),
                        metadata.get("artist"),
                        metadata.get("album"),
                        os.path.basename(file_path),
                    ],
                )
            ).lower()

            if search_lower in searchable_text:
                filtered_files.append(file_path)
        all_files = filtered_files

    total = len(all_files)

    # Paginacja
    paginated_files = all_files[offset : offset + limit]

    # Budowanie wyników
    items = []
    for file_path in paginated_files:
        metadata = extract_metadata(file_path)
        file_item = {
            "id": get_file_id(file_path),
            "path": file_path,
            "filename": os.path.basename(file_path),
            **metadata,
        }
        items.append(file_item)

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < total,
        "search": search,
    }


def get_file_by_id(file_id: str) -> Optional[dict]:
    """
    Znajduje plik po ID i zwraca jego metadane.
    Zwraca None jeśli plik nie został znaleziony.
    """
    all_files = scan_music_directory()

    for file_path in all_files:
        if get_file_id(file_path) == file_id:
            metadata = extract_metadata(file_path)
            return {
                "id": file_id,
                "path": file_path,
                "filename": os.path.basename(file_path),
                **metadata,
            }

    return None
