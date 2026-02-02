# Backend API – Files

Backend udostępnia REST API do przeglądania plików muzycznych z katalogu, pobierania ich metadanych oraz okładek albumów.

---

## Endpoints – overview

| Metoda | Ścieżka                         | Opis                                                       |
|--------|---------------------------------|------------------------------------------------------------|
| GET    | `/api/files`                   | Lista plików muzycznych z paginacją i wyszukiwaniem.       |
| GET    | `/api/files/thumbnail`         | Pobieranie okładki albumu z pliku muzycznego.              |

---

## `GET /api/files`

Zwraca listę plików muzycznych z metadanymi (ID3, Vorbis, MP4). Obsługuje paginację offset + limit oraz wyszukiwanie po tytule, artyście, albumie lub nazwie pliku.

### Query params

```text
offset: int  (opcjonalny) – indeks pierwszego elementu (domyślnie 0)
limit: int   (opcjonalny) – liczba elementów (1-100, domyślnie 50)
search: string (opcjonalny) – fraza wyszukiwania
```

Przykład:

```http
GET /api/files?offset=0&limit=50
GET /api/files?search=queen
GET /api/files?offset=50&limit=25&search=rock
```

### Response

```json
{
  "items": [
    {
      "id": "8c4419a56b992e61",
      "path": "/music/Rock/Queen - Bohemian Rhapsody.mp3",
      "filename": "Queen - Bohemian Rhapsody.mp3",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "year": 1975,
      "track_number": 11,
      "genre": "Rock",
      "duration": 354.5,
      "bitrate": 320,
      "format": "mp3",
      "file_size": 14123456,
      "has_cover": true
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 50,
  "has_more": false,
  "search": "queen"
}
```

Pola:

- `id` – unikalny identyfikator pliku (hash ścieżki)
- `path` – pełna ścieżka do pliku
- `filename` – nazwa pliku
- `title` – tytuł utworu z metadanych (może być null)
- `artist` – wykonawca (może być null)
- `album` – album (może być null)
- `year` – rok wydania (może być null)
- `track_number` – numer utworu na albumie (może być null)
- `genre` – gatunek (może być null)
- `duration` – długość utworu w sekundach (może być null)
- `bitrate` – bitrate w kbps (może być null)
- `format` – format pliku (mp3, flac, m4a, ogg, opus, wma, wav)
- `file_size` – rozmiar pliku w bajtach
- `has_cover` – czy plik zawiera osadzoną okładkę (true/false)
- `total` – całkowita liczba plików (z uwzględnieniem wyszukiwania)
- `has_more` – czy są kolejne strony do pobrania

---

## `GET /api/files/thumbnail`

Zwraca okładkę albumu osadzoną w pliku muzycznym (JPEG/PNG). Zwraca 404 jeśli plik nie ma okładki.

### Query params

```text
path: string (wymagany) – pełna ścieżka do pliku muzycznego
```

Przykład:

```http
GET /api/files/thumbnail?path=%2Fmusic%2FRock%2FQueen%20-%20Bohemian%20Rhapsody.mp3
```

### Response

**Success:**

- Status: 200 OK
- Content-Type: `image/jpeg` lub `image/png`
- Headers: `Cache-Control: public, max-age=86400` (24h cache)

**Error 404:**

```json
{
  "detail": "No cover art found in file"
}
```

---

## Obsługiwane formaty

- **MP3** (`.mp3`) – ID3v2 tags
- **FLAC** (`.flac`) – Vorbis comments + embedded pictures
- **M4A/AAC** (`.m4a`, `.aac`) – MP4 atoms
- **OGG** (`.ogg`) – Vorbis comments
- **OPUS** (`.opus`) – Vorbis comments  
- **WMA** (`.wma`) – ASF metadata
- **WAV** (`.wav`) – ograniczone metadane

---

## Środowisko

W kontenerze Docker katalog z muzyką jest montowany pod `/music`. Lokalnie można ustawić zmienną środowiskową:

```bash
MUSIC_DIR=/path/to/music uvicorn app.main:app --reload
```

Dla Dockera:

```yaml
volumes:
  - /host/music:/music
```
