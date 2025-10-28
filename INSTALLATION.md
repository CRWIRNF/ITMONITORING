# Installation und Setup - IT Monitoring Dashboard

## Problem: Verbindungsfehler beim Öffnen von dashboard.html

Wenn Sie `dashboard.html` direkt aus Git herunterladen und im Browser öffnen, erhalten Sie einen Verbindungsfehler. Dies liegt an:

1. **CORS (Cross-Origin Resource Sharing)**: Browser blockieren API-Anfragen von lokalen Dateien (`file://`)
2. **IP-Beschränkungen**: Die Castor Marine API erlaubt nur Zugriffe von bestimmten IP-Adressen/Netzwerken

## ✅ Lösung 1: Demo-Version (Empfohlen zum Testen)

Die einfachste Methode, um das Dashboard zu sehen:

### Schritt 1: Datei herunterladen
```bash
git clone <repository-url>
cd ITMONITORING
```

### Schritt 2: Demo-Version öffnen
Doppelklicken Sie auf `dashboard-demo.html` ODER öffnen Sie die Datei direkt im Browser.

**Vorteile:**
- ✓ Funktioniert sofort ohne Server
- ✓ Zeigt Ihre echten Daten (Stand: 28.10.2025)
- ✓ Perfekt zum Testen des Designs und Layouts
- ✓ Keine Installation nötig

**Nachteile:**
- ✗ Keine Live-Daten (statische Demo)
- ✗ Kein Auto-Refresh

---

## ✅ Lösung 2: Proxy-Server (Empfohlen für Produktion)

Für Live-Daten mit Auto-Refresh verwenden Sie den mitgelieferten Proxy-Server:

### Voraussetzungen
- Python 3 (bereits auf den meisten Systemen installiert)

### Schritt 1: Repository herunterladen
```bash
git clone <repository-url>
cd ITMONITORING
```

### Schritt 2: Proxy-Server starten
```bash
python3 proxy-server.py
```

Sie sehen dann:
```
============================================================
IT Monitoring Dashboard - Proxy Server
============================================================

🚀 Server läuft auf: http://localhost:8080

📊 Dashboard öffnen: http://localhost:8080/dashboard.html
📊 Demo-Version: http://localhost:8080/dashboard-demo.html

💡 Drücken Sie Strg+C zum Beenden

============================================================
```

### Schritt 3: Dashboard öffnen
Öffnen Sie im Browser: **http://localhost:8080/dashboard.html**

**Vorteile:**
- ✓ Echte Live-Daten von der API
- ✓ Auto-Refresh alle 30 Sekunden
- ✓ Löst CORS-Probleme
- ✓ Einfache Einrichtung
- ✓ Funktioniert im lokalen Netzwerk

**Nachteile:**
- ⚠ Server muss laufen bleiben
- ⚠ Benötigt Python 3

### Alternativer Port
Falls Port 8080 bereits belegt ist:
```bash
python3 proxy-server.py 3000
```

---

## ✅ Lösung 3: Direkter Zugriff (nur im richtigen Netzwerk)

Wenn Sie sich im gleichen Netzwerk wie die API befinden:

### Schritt 1: Einfachen Webserver starten
```bash
cd ITMONITORING

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Schritt 2: Dashboard öffnen
Öffnen Sie: **http://localhost:8000/dashboard.html**

**Wichtig:** Diese Lösung funktioniert nur, wenn:
- Sie sich im gleichen Netzwerk wie die API befinden
- Ihre IP-Adresse in der API-Whitelist ist
- Keine Firewall den Zugriff blockiert

---

## 🖥️ TV-Display Setup

### Für permanente Anzeige auf einem TV-Bildschirm:

#### Option A: Mit Proxy-Server (Empfohlen)

1. **Proxy-Server als Dienst einrichten** (Linux/Raspberry Pi)
   ```bash
   sudo nano /etc/systemd/system/dashboard-proxy.service
   ```

   Inhalt:
   ```ini
   [Unit]
   Description=IT Monitoring Dashboard Proxy
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/ITMONITORING
   ExecStart=/usr/bin/python3 /home/pi/ITMONITORING/proxy-server.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Aktivieren:
   ```bash
   sudo systemctl enable dashboard-proxy.service
   sudo systemctl start dashboard-proxy.service
   ```

2. **Browser im Kiosk-Modus starten**
   ```bash
   chromium-browser --kiosk --app=http://localhost:8080/dashboard.html
   ```

#### Option B: Mit Demo-Version (Offline)

Wenn Sie keine Live-Daten benötigen:
```bash
chromium-browser --kiosk --app=file:///home/pi/ITMONITORING/dashboard-demo.html
```

### Autostart einrichten (Raspberry Pi / Linux)

1. Bearbeiten Sie die Autostart-Datei:
   ```bash
   nano ~/.config/lxsession/LXDE-pi/autostart
   ```

2. Fügen Sie hinzu:
   ```bash
   @xset s off
   @xset -dpms
   @xset s noblank
   @chromium-browser --kiosk --app=http://localhost:8080/dashboard.html
   ```

3. Starten Sie neu:
   ```bash
   sudo reboot
   ```

---

## 🔧 Fehlerbehebung

### Problem: "Connection refused" oder "ERR_CONNECTION_REFUSED"

**Ursache:** Proxy-Server läuft nicht

**Lösung:**
1. Starten Sie den Proxy-Server: `python3 proxy-server.py`
2. Prüfen Sie, ob Port 8080 frei ist
3. Verwenden Sie alternativ die Demo-Version

### Problem: "Access denied" im Proxy-Server

**Ursache:** API erlaubt keinen Zugriff von Ihrer IP

**Lösung:**
1. Prüfen Sie Ihre Netzwerkverbindung
2. Kontaktieren Sie Castor Marine für API-Zugriff
3. Verwenden Sie die Demo-Version zum Testen

### Problem: Dashboard zeigt veraltete Daten

**Ursache:** Browser-Cache

**Lösung:**
1. Drücken Sie `Strg+F5` (Hard Refresh)
2. Oder öffnen Sie Browser-Entwicklertools (F12) und deaktivieren Sie Cache
3. Oder löschen Sie Browser-Cache

### Problem: Python nicht gefunden

**Lösung (Windows):**
1. Laden Sie Python von [python.org](https://www.python.org/downloads/) herunter
2. Installieren Sie mit "Add to PATH" aktiviert
3. Öffnen Sie neue Kommandozeile

**Lösung (Mac):**
```bash
# Python 3 installieren mit Homebrew
brew install python3
```

**Lösung (Linux/Raspberry Pi):**
```bash
sudo apt-get update
sudo apt-get install python3
```

---

## 📊 Vergleich der Lösungen

| Feature | Demo-Version | Proxy-Server | Direkter Zugriff |
|---------|--------------|--------------|------------------|
| **Installation** | Keine | Python 3 | Python 3 |
| **Live-Daten** | ✗ | ✓ | ✓ |
| **Auto-Refresh** | ✗ | ✓ | ✓ |
| **Offline-fähig** | ✓ | ✗ | ✗ |
| **CORS-Problem** | Keins | Gelöst | Kann auftreten |
| **Netzwerk-Anforderung** | Keine | Lokal | API-Zugriff nötig |
| **Empfohlen für** | Testen, Demo | Produktion | Intranet |

---

## 🚀 Schnellstart-Zusammenfassung

### Für schnelle Demo (1 Minute):
```bash
# 1. Repository klonen
git clone <repository-url>
cd ITMONITORING

# 2. Demo-Datei öffnen
# Doppelklick auf dashboard-demo.html
```

### Für Live-Daten (2 Minuten):
```bash
# 1. Repository klonen
git clone <repository-url>
cd ITMONITORING

# 2. Proxy-Server starten
python3 proxy-server.py

# 3. Browser öffnen
# http://localhost:8080/dashboard.html
```

### Für TV-Display (5 Minuten):
```bash
# 1. Proxy-Server als Dienst einrichten (siehe oben)
# 2. Browser im Kiosk-Modus starten
# 3. Autostart konfigurieren
```

---

## 📞 Support

Bei Problemen:
1. Überprüfen Sie diese Anleitung
2. Schauen Sie in die Browser-Konsole (F12)
3. Prüfen Sie die Proxy-Server-Logs
4. Kontaktieren Sie die IT-Abteilung

---

## 🔒 Sicherheitshinweise

- **API-Token:** Der Token ist im Code eingebettet. Für Produktionsumgebungen sollten Sie den Token über Umgebungsvariablen laden.
- **Netzwerk:** Der Proxy-Server läuft standardmäßig nur auf localhost. Für Zugriff aus dem Netzwerk passen Sie die Konfiguration an.
- **Updates:** Aktualisieren Sie regelmäßig den API-Token (läuft ab am 28.10.2026)
