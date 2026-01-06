# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Poetry
RUN pip install poetry

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy dependency files first for better caching
COPY backend/pyproject.toml backend/poetry.lock ./

# Install dependencies
RUN poetry install --only=main --no-interaction --no-ansi

# Copy the rest of the application
COPY backend/ ./

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
