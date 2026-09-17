# ===================================================
# Stage 1: Build Frontend (React + Vite)
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ===================================================
# Stage 2: Production Python Backend & Fullstack Server
# ===================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

# Install system utilities (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and schemas
COPY . .

# Copy compiled frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run sets $PORT dynamically, default 8080)
EXPOSE 8080

# Health check against /healthz
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/healthz || exit 1

# Launch Uvicorn with concurrency
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2"]
