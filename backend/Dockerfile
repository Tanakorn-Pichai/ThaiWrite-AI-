FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMuPDF and PyThaiNLP
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download PyThaiNLP data dictionary
RUN python -c "from pythainlp.corpus import thai_words; thai_words()"

COPY . /app/backend/

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
