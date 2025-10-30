# Dashboard Docker Image
FROM python:3.11-slim

# Metadaten
LABEL maintainer="IT-Abteilung"
LABEL description="IT Monitoring Dashboard für Starlink-Systeme"

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Systemabhängigkeiten installieren
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Dashboard-Dateien kopieren
COPY dashboard.html .
COPY dashboard-demo.html .
COPY proxy-server.py .
COPY README.md .
COPY INSTALLATION.md .
COPY config.js .

# Port exponieren
EXPOSE 8080

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/dashboard-demo.html || exit 1

# Nicht-Root-User erstellen
RUN useradd -m -u 1000 dashboard && \
    chown -R dashboard:dashboard /app

USER dashboard

# Server starten
CMD ["python3", "proxy-server.py"]
