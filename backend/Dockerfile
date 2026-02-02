FROM python:3.12-slim AS base

WORKDIR /app

# Install ffmpeg + cleanup w jednym layerze
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* /tmp/*

FROM base AS builder

# Create non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Copy ONLY requirements - warstwa cacheowalna
COPY requirements.txt .

# Install deps z cache mount - KLUCZOWE
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user -r requirements.txt

# Final stage - minimalny obraz
FROM base AS final

# Kopiuj usera z buildera
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Kopiuj tylko zainstalowane pakiety (nie całe /root/.cache)
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

WORKDIR /app

# Copy tylko kod aplikacji (bez requirements.txt który już jest wykorzystany)
COPY --chown=appuser:appgroup ./app ./app

USER appuser
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
