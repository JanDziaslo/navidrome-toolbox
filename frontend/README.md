# Navidrome Toolbox Frontend

## Setup

1. Copy the environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `API_URL` - Backend API URL (default: http://localhost:8000)
  - This is a server-side only variable (not exposed to browser)
  - All API requests go through Next.js proxy routes

## Architecture

The frontend uses Next.js as a proxy to the backend API:

```
Browser → Next.js (/api/* routes) → Backend API
```

### API Routes

- `GET /api/health` - Health check
- `GET /api/youtube/query?q=...` - Search YouTube
- `POST /api/youtube/formats` - Get available formats
- `POST /api/youtube/download` - Download video
- `POST /api/youtube/download/stream` - Download with SSE progress

This architecture ensures the backend API is never directly exposed to users.

## Features

- Dashboard with available tools
- YouTube Downloader with:
  - Search functionality
  - Format selection
  - Real-time download progress via SSE
  - Health check status
