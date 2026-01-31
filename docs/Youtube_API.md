
# Backend API – YouTube downloader

Backend udostępnia REST API do wyszukiwania na YouTube, pobierania listy formatów oraz pobierania plików (w trybie zwykłym i strumieniowym SSE z progressem). Strumień progresu jest realizowany jako Server‑Sent Events z `Content-Type: text/event-stream`, gdzie każdy event to linia `data: ...` zakończona pustą linią, zgodnie ze specyfikacją SSE.

---

## Endpoints – overview

| Metoda | Ścieżka                         | Opis                                                       |
|--------|---------------------------------|------------------------------------------------------------|
| GET    | `/api/youtube/query`           | Wyszukiwanie na YouTube po frazie.                        |
| POST   | `/api/youtube/formats`         | Lista dostępnych formatów dla konkretnego wideo.          |
| POST   | `/api/youtube/download`        | Jednorazowe pobranie pliku, odpowiedź po zakończeniu.     |
| POST   | `/api/youtube/download/stream` | Strumień SSE z progressem i statusem pobierania. |

---

## `GET /api/youtube/query`

 Wyszukiwanie filmów / utworów na YouTube.

### Query params

```text
q: string   (wymagany) – fraza do wyszukania
limit: int  (opcjonalny) – maks. liczba wyników (1-50, domyślnie 10)
music_only: bool (opcjonalny) – preferuj wyniki YouTube Music / topic (domyślnie true)
```

Przykład:

```http
GET /api/youtube/query?q=rick%20astley%20never%20gonna%20give%20you%20up&limit=2
```

### Response

```json
{
  "results": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
      "duration": 214,
      "uploader": "Rick Astley",
      "view_count": 1737639150,
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      "id": "drxI-0W4pII",
      "title": "Rick Astley Never Gonna Give You Up (audio HQ) ",
      "duration": 215,
      "uploader": "Richard Noel Marx",
      "view_count": 91,
      "thumbnail": "https://i.ytimg.com/vi/drxI-0W4pII/mqdefault.jpg",
      "url": "https://www.youtube.com/watch?v=drxI-0W4pII"
    }
  ],
  "count": 2
}
```

---

## `POST /api/youtube/formats`

Zwraca listę dostępnych formatów (audio / video) dla konkretnego wideo.

### Request body

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Przykład:

```http
POST /api/youtube/formats
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Response

```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
  "formats": [
    {
      "format_id": "140",
      "ext": "m4a",
      "quality": "medium",
      "resolution": "audio only",
      "filesize": 3449447,
      "audio_codec": "mp4a.40.2",
      "video_codec": "none",
      "vbr": 0.0,
      "abr": 129.502
    },
    {
      "format_id": "251",
      "ext": "webm",
      "quality": "medium",
      "resolution": "audio only",
      "filesize": 3433755,
      "audio_codec": "opus",
      "video_codec": "none",
      "vbr": 0.0,
      "abr": 128.93
    }
  ]
}
```

(Wartości typu `filesize` są przykładowe – frontend używa ich tylko orientacyjnie.)  

---

## `POST /api/youtube/download`

Jednorazowy download – request blokuje się do końca pobierania i zwraca wynik w jednym JSON.

### Request body

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "format_id": "140",
  "output_template": "%(artist, uploader)s - %(title, track)s.%(ext)s"
}
```

Pola:

- `url` – pełny link do YouTube. [web:201]  
- `format_id` – identyfikator formatu zwrócony przez `/formats` (np. `"140"`).  
- `output_template` – szablon nazwy pliku używany przez yt-dlp.  

### Response

```json
{
  "success": true,
  "file_path": "/tmp/tmpxb3bpmtm/test.m4a",
  "message": "Downloaded successfully"
}
```

---

## `POST /api/youtube/download/stream` (SSE)

Endpoint do pobierania z **progresem w czasie rzeczywistym**, realizowanym przez Server‑Sent Events (`text/event-stream`).

### Request body

Ten sam kształt co w `/download`:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "format_id": "140",
  "output_template": "%(artist, uploader)s - %(title, track)s.%(ext)s"
}
```

### Response – format SSE

Nagłówki (po stronie serwera):

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

Każdy event ma postać:

```text
data: {JSON}
<blank line>
```

co jest wymaganym formatem SSE (UTF‑8, eventy oddzielone pustą linią).

Przykładowy strumień (uproszczony):

```text
data: {
  "status": "downloading",
  "downloaded": 1047552,
  "total": 3500000,
  "percent": 29.9,
  "speed": 10037446.18,
  "eta": 0
}

data: {
  "status": "downloading",
  "downloaded": 3200000,
  "total": 3500000,
  "percent": 91.4,
  "speed": 16000000.0,
  "eta": 0
}

data: {
  "status": "downloading",
  "downloaded": 3500000,
  "total": 3500000,
  "percent": 100.0,
  "speed": 8000000.0,
  "eta": 0
}

data: {
  "status": "finished",
  "filename": "/tmp/yt_0ezc5ege/test.m4a"
}

data: {
  "status": "complete",
  "success": true,
  "file_path": "/tmp/yt_0ezc5ege/test.m4a"
}
```

### Typy eventów po stronie klienta

```ts
type DownloadEvent =
  | {
      status: 'downloading';
      downloaded: number;
      total: number;
      percent: number;
      eta: number;
      speed: number;
    }
  | {
      status: 'finished';
      filename: string;
    }
  | {
      status: 'complete';
      success: boolean;
      file_path: string;
    };
```

Frontend:

- buduje **progress bar** na eventach `status: 'downloading'`,  
- po `status: 'finished'` wie, że plik jest zapisany na dysku,  
- po `status: 'complete'` kończy operację i może odpalić kolejne kroki (np. wrzutkę do Navidrome).  
