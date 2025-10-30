# Docker Deployment - IT Monitoring Dashboard

## 🐳 Schnellstart mit Docker

### Voraussetzungen
- Docker installiert ([Installation](https://docs.docker.com/get-docker/))
- Docker Compose installiert ([Installation](https://docs.docker.com/compose/install/))

---

## 🚀 **Methode 1: Docker Compose (Empfohlen)**

### Schritt 1: Repository klonen
```bash
git clone https://github.com/CRWIRNF/ITMONITORING.git
cd ITMONITORING
```

### Schritt 2: Container starten
```bash
docker-compose up -d
```

### Schritt 3: Dashboard öffnen
```bash
# Im Browser öffnen:
http://localhost:8080/dashboard.html
# oder Demo-Version:
http://localhost:8080/dashboard-demo.html
```

**Fertig!** Das Dashboard läuft jetzt im Container! 🎉

---

## 🔧 **Docker-Befehle**

### Container-Management
```bash
# Container starten
docker-compose up -d

# Container stoppen
docker-compose down

# Container neu starten
docker-compose restart

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps

# Container neu bauen
docker-compose up -d --build
```

### Image-Management
```bash
# Image bauen
docker build -t it-monitoring-dashboard .

# Images auflisten
docker images | grep dashboard

# Image löschen
docker rmi it-monitoring-dashboard
```

### Container-Verwaltung
```bash
# In Container einsteigen
docker exec -it it-monitoring-dashboard sh

# Container-Ressourcen prüfen
docker stats it-monitoring-dashboard

# Container-Details
docker inspect it-monitoring-dashboard
```

---

## 📦 **Methode 2: Docker ohne Compose**

### Image bauen
```bash
docker build -t it-monitoring-dashboard .
```

### Container starten
```bash
docker run -d \
  --name it-monitoring-dashboard \
  -p 8080:8080 \
  --restart unless-stopped \
  it-monitoring-dashboard
```

### Container verwalten
```bash
# Stoppen
docker stop it-monitoring-dashboard

# Starten
docker start it-monitoring-dashboard

# Logs
docker logs -f it-monitoring-dashboard

# Entfernen
docker rm -f it-monitoring-dashboard
```

---

## 🌐 **Produktions-Deployment**

### Mit Nginx als Reverse Proxy

#### docker-compose.yml erweitern:
```yaml
version: '3.8'

services:
  dashboard:
    build: .
    container_name: it-monitoring-dashboard
    expose:
      - "8080"
    restart: unless-stopped
    networks:
      - dashboard-network

  nginx:
    image: nginx:alpine
    container_name: dashboard-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - dashboard
    restart: unless-stopped
    networks:
      - dashboard-network

networks:
  dashboard-network:
    driver: bridge
```

#### nginx.conf erstellen:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream dashboard {
        server dashboard:8080;
    }

    server {
        listen 80;
        server_name ihr-server.de;

        location / {
            proxy_pass http://dashboard;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

Starten:
```bash
docker-compose up -d
```

---

## 🔒 **Umgebungsvariablen (Sicherheit)**

### API-Token über Environment-Variable

#### .env Datei erstellen:
```bash
# .env
API_TOKEN=IhrGeheimer_Token_Hier
API_BASE_URL=https://portal.apps.castormarine.com/api
REFRESH_INTERVAL=30000
```

#### docker-compose.yml anpassen:
```yaml
services:
  dashboard:
    build: .
    env_file:
      - .env
    environment:
      - API_TOKEN=${API_TOKEN}
      - API_BASE_URL=${API_BASE_URL}
```

#### proxy-server.py anpassen:
```python
import os
API_TOKEN = os.getenv('API_TOKEN', 'fallback-token')
```

---

## 🖥️ **Multi-Architecture Build**

Für verschiedene Plattformen (ARM, x86):

```bash
# Buildx aktivieren
docker buildx create --use

# Für ARM64 und AMD64 bauen
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t it-monitoring-dashboard:latest \
  --push .
```

---

## 📊 **Monitoring & Health Checks**

### Container-Health prüfen:
```bash
docker inspect --format='{{.State.Health.Status}}' it-monitoring-dashboard
```

### Logs überwachen:
```bash
# Live-Logs
docker-compose logs -f dashboard

# Letzte 100 Zeilen
docker-compose logs --tail=100 dashboard

# Nur Fehler
docker-compose logs dashboard | grep -i error
```

---

## 🔧 **Troubleshooting**

### Problem: Container startet nicht
```bash
# Logs prüfen
docker-compose logs dashboard

# Container-Details
docker inspect it-monitoring-dashboard

# Neu bauen
docker-compose down
docker-compose up -d --build
```

### Problem: Port bereits belegt
```bash
# Anderen Port verwenden
docker run -p 8081:8080 ...

# Oder in docker-compose.yml:
ports:
  - "8081:8080"
```

### Problem: API nicht erreichbar
```bash
# In Container einsteigen und testen
docker exec -it it-monitoring-dashboard sh
curl https://portal.apps.castormarine.com/api/service-lines
```

---

## 🚢 **Deployment-Szenarien**

### Szenario 1: Lokale Entwicklung
```bash
docker-compose up
# Dashboard auf http://localhost:8080
```

### Szenario 2: Debian-Server
```bash
# Auf Server kopieren
scp -r ITMONITORING user@server:/opt/

# Auf Server
cd /opt/ITMONITORING
docker-compose up -d
```

### Szenario 3: Raspberry Pi
```bash
# ARM-kompatibles Image bauen
docker build --platform linux/arm64 -t dashboard .
docker run -d -p 8080:8080 dashboard
```

### Szenario 4: Cloud (AWS, Azure, GCP)
```bash
# Image in Registry pushen
docker tag it-monitoring-dashboard your-registry/dashboard
docker push your-registry/dashboard

# Auf Cloud-Instanz deployen
docker pull your-registry/dashboard
docker run -d -p 80:8080 your-registry/dashboard
```

---

## 📋 **Cheatsheet**

| Aufgabe | Befehl |
|---------|--------|
| **Starten** | `docker-compose up -d` |
| **Stoppen** | `docker-compose down` |
| **Neu starten** | `docker-compose restart` |
| **Logs** | `docker-compose logs -f` |
| **Neu bauen** | `docker-compose up -d --build` |
| **Status** | `docker-compose ps` |
| **In Container** | `docker exec -it it-monitoring-dashboard sh` |
| **Aufräumen** | `docker system prune -a` |

---

## 🎯 **Vorteile von Docker-Deployment**

✅ **Isolation**: Container ist unabhängig vom Host-System
✅ **Portabilität**: Läuft überall (Mac, Windows, Linux, Cloud)
✅ **Einfaches Deployment**: Ein Befehl zum Starten
✅ **Reproduzierbar**: Immer die gleiche Umgebung
✅ **Skalierbar**: Mehrere Instanzen einfach starten
✅ **Updates**: Neues Image pullen und neu starten
✅ **Rollback**: Zurück zur vorherigen Version

---

## 🔄 **Update-Prozess**

```bash
# 1. Neueste Version pullen
git pull

# 2. Image neu bauen
docker-compose build

# 3. Container neu starten
docker-compose up -d

# 4. Alte Images aufräumen
docker image prune -f
```

---

## 🆘 **Support**

Bei Problemen:
1. Logs prüfen: `docker-compose logs -f`
2. Container-Status: `docker-compose ps`
3. Health-Check: `docker inspect it-monitoring-dashboard`
4. Dokumentation: `README.md` und `INSTALLATION.md`

---

## 📚 **Weiterführende Links**

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
