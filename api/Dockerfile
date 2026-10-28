# Lean Python CPU base image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MODEL_DIR=/models

WORKDIR /app

# Install dependencies
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy API, trainer, and reference data source code
COPY api/ /app/api/
COPY trainer/ /app/trainer/
COPY data/ /app/data/

# Create non-root user and ensure data directories are writable
RUN mkdir -p /app/data/batches && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser
WORKDIR /app/api

EXPOSE 8000

# Health check using standard Python urllib
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; res = urllib.request.urlopen('http://localhost:8000/health'); assert res.getcode() == 200" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
