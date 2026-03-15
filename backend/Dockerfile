FROM python:3.11-slim

WORKDIR /app

# Install nuclei scanner + pre-cache templates
RUN apt-get update && apt-get install -y wget unzip git ca-certificates && \
    wget -q https://github.com/projectdiscovery/nuclei/releases/download/v3.2.0/nuclei_3.2.0_linux_amd64.zip && \
    unzip nuclei_3.2.0_linux_amd64.zip -d /usr/local/bin/ && \
    rm nuclei_3.2.0_linux_amd64.zip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-download nuclei templates into a known fixed path
ENV NUCLEI_TEMPLATES_PATH=/app/nuclei-templates
RUN nuclei -update-templates -ud /app/nuclei-templates -silent || true

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Run with gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 4 --timeout 300 webhook_server:app
