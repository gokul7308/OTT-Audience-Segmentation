FROM python:3.11-slim

# Create non-root user
RUN useradd -m appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything
COPY . .

# Ensure models directory is writable
RUN mkdir -p /models /app/models /app/data/processed && chown -R appuser:appuser /app /models /app/models

USER appuser

# Run both the feature builder and cluster trainer sequentially
CMD ["sh", "-c", "python feature_builder.py && python train_clusters.py"]
