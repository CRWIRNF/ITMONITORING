# IT Monitoring Dashboard - Starlink Status

Ein professionelles Dashboard zur Überwachung von Starlink-Systemen, optimiert für große TV-Bildschirme.

## Features

- **Echtzeit-Monitoring** von Starlink-Systemen auf Schiffen
- **Automatische Aktualisierung** alle 30 Sekunden
- **Visuelle Status-Indikatoren** (Aktiv, Inaktiv, Warnung)
- **Detaillierte Metriken** für jede Service-Line:
  - **Schiffsinformationen**: Name und IMO-Nummer
  - **Service-Status**: Aktiv/Inaktiv mit visueller Anzeige
  - **Terminal-Status**: Anzahl aktiver Terminals
  - **Datenverbrauch**: Monatlicher Verbrauch in GB
  - **Verbrauchsübersicht**: Prozentuale Auslastung des Daten-Limits
  - **Standard- und Priority-Daten**: Aufschlüsselung des Verbrauchs
  - **Hardware-Details**: Kit- und Dish-Seriennummern
- **Intelligente Warnungen**:
  - Orange-Warnung bei Datenverbrauch >80%
  - Rot-Warnung bei Überschreitung des Limits (>100%)
  - Automatische Erkennung inaktiver Terminals
- **Responsive Design** für verschiedene Bildschirmgrößen
- **Farbcodierte Visualisierung** für schnelle Übersicht
- **TV-optimiert** mit großen, gut lesbaren Elementen

## Installation

### Voraussetzungen

- Webbrowser (Chrome, Firefox, Safari oder Edge empfohlen)
- Zugriff auf das Netzwerk, in dem die Castor Marine API erreichbar ist
- Gültiger API-Token

### Schnellstart

1. **Dateien herunterladen**
   ```bash
   git clone <repository-url>
   cd ITMONITORING
   ```

2. **Dashboard öffnen**
   - Öffnen Sie die Datei `dashboard.html` direkt im Browser
   - Oder starten Sie einen lokalen Webserver:
     ```bash
     # Python 3
     python3 -m http.server 8000

     # Python 2
     python -m SimpleHTTPServer 8000

     # Node.js (mit npx)
     npx http-server
     ```
   - Dann im Browser öffnen: `http://localhost:8000/dashboard.html`

3. **Für TV-Display**
   - Öffnen Sie das Dashboard im Browser
   - Drücken Sie `F11` für Vollbildmodus
   - Das Dashboard aktualisiert sich automatisch

## Konfiguration

### API-Token aktualisieren

Öffnen Sie `dashboard.html` und aktualisieren Sie den API-Token im JavaScript-Bereich:

```javascript
const API_CONFIG = {
    token: 'IHR_API_TOKEN_HIER'
};
```

Oder verwenden Sie die externe Konfigurationsdatei `config.js` (siehe Erweiterte Konfiguration).

### Erweiterte Konfiguration

Die Datei `config.js` enthält alle Konfigurationsoptionen:

```javascript
const CONFIG = {
    api: {
        baseUrl: 'https://portal.apps.castormarine.com/api',
        token: 'IHR_API_TOKEN',
        endpoint: '/service-lines'
    },
    dashboard: {
        refreshInterval: 30000,  // 30 Sekunden
        title: 'IT Monitoring Dashboard',
        useMockData: false       // true für Entwicklung
    },
    thresholds: {
        signalStrength: {
            warning: 70,
            offline: 0
        }
    }
};
```

### Anpassungen

#### Aktualisierungsintervall ändern

```javascript
refreshInterval: 60000  // 60 Sekunden
```

#### Dashboard-Titel ändern

```javascript
title: 'Ihre IT-Abteilung'
```

#### Status-Schwellenwerte anpassen

```javascript
thresholds: {
    signalStrength: {
        warning: 60,  // Warnung unter 60%
        offline: 0
    }
}
```

## API-Endpunkt

Das Dashboard nutzt die Castor Marine API:

**Endpoint:** `GET https://portal.apps.castormarine.com/api/service-lines`

**Header:**
```
Accept: application/json, application/problem+json
Authorization: Bearer YOUR_TOKEN
```

### API-Response-Struktur

Das Dashboard verarbeitet die Castor Marine API-Response mit folgender Struktur:

```json
{
  "serviceLines": [
    {
      "id": "uuid",
      "name": "SCHIFFSNAME (IMO: 1234567) KITP00373617",
      "nickname": "SCHIFFSNAME (IMO: 1234567) KITP00373617",
      "status": "active",
      "monthlyUsage": [
        {
          "totalStandardGb": 23.48,
          "totalPriorityGb": 1000.68,
          "totalOptInPriorityGb": 0,
          "totalNonBillableGb": 0,
          "includedGb": 1000,
          "startDate": "2025-10-01T00:00:00Z",
          "endDate": "2025-11-01T00:00:00Z"
        }
      ],
      "userTerminals": [
        {
          "id": "01000000-00000000-00c326fa",
          "kitSerialNumber": "KITP00373617",
          "dishSerialNumber": "HPCP411939100801",
          "active": true
        }
      ]
    }
  ],
  "total": 6
}
```

**Wichtige Felder:**
- `serviceLines`: Array mit allen Service-Lines (Schiffe)
- `name`: Enthält Schiffsname, IMO-Nummer und Kit-Serial
- `status`: "active" oder andere Status-Werte
- `monthlyUsage`: Array mit monatlichen Verbrauchsdaten (erstes Element = aktueller Monat)
- `userTerminals`: Array mit Starlink-Terminals
- `active`: Boolean, ob Terminal aktiv ist

**Status-Logik:**
- **Aktiv** (Grün): Service-Line ist aktiv, Terminals sind online, Datenverbrauch <100%
- **Warnung** (Orange): Datenverbrauch ≥100% des Limits
- **Inaktiv** (Rot): Service-Line inaktiv ODER keine aktiven Terminals

## Entwicklung & Testing

### Tastatur-Shortcuts

- **F5** oder **Strg+R**: Manuelles Refresh
- **F11**: Vollbildmodus (Browser-Standard)

### Browser-Konsole

Öffnen Sie die Entwickler-Konsole (F12) für:
- Fehler-Logs
- API-Response-Details
- Status-Meldungen

## Fehlerbehebung

### Dashboard zeigt "Access denied"

**Problem:** Die API ist von diesem Netzwerk aus nicht erreichbar.

**Lösung:**
- Stellen Sie sicher, dass Sie sich im richtigen Netzwerk befinden
- Überprüfen Sie die Firewall-Einstellungen
- Verwenden Sie Mock-Daten zum Testen (Taste `M`)

### Daten werden nicht aktualisiert

**Problem:** Auto-Refresh funktioniert nicht.

**Lösung:**
- Überprüfen Sie die Browser-Konsole auf Fehler
- Prüfen Sie die Netzwerkverbindung
- Manuelles Refresh mit `F5`

### API-Token abgelaufen

**Problem:** 401 oder 403 Fehler in der Konsole.

**Lösung:**
- Neuen API-Token generieren
- Token in `dashboard.html` oder `config.js` aktualisieren

### Dashboard ist zu klein/groß

**Problem:** Elemente sind nicht optimal für Ihren Bildschirm.

**Lösung:**
- Verwenden Sie Browser-Zoom (Strg + Plus/Minus)
- Passen Sie CSS-Werte in `dashboard.html` an:
  ```css
  .header h1 {
      font-size: 3em;  /* Größer für große Displays */
  }
  ```

## TV-Display Empfehlungen

### Optimale Einstellungen

1. **Browser:** Chrome oder Firefox im Vollbildmodus (F11)
2. **Auflösung:** 1920x1080 oder höher
3. **Auto-Refresh:** Standardmäßig aktiviert (30 Sekunden)
4. **Energiespar-Modus:** Deaktivieren Sie Bildschirmschoner

### Automatischer Start (Kiosk-Modus)

#### Windows
```bash
chrome.exe --kiosk --app=file:///C:/pfad/zu/dashboard.html
```

#### Linux
```bash
chromium-browser --kiosk --app=file:///home/user/ITMONITORING/dashboard.html
```

#### macOS
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --app=file:///Users/username/ITMONITORING/dashboard.html
```

### Raspberry Pi Setup

Ideal für dedizierte TV-Displays:

```bash
# Chromium installieren
sudo apt-get install chromium-browser unclutter

# Autostart konfigurieren
nano ~/.config/lxsession/LXDE-pi/autostart

# Folgendes hinzufügen:
@chromium-browser --kiosk --app=file:///home/pi/ITMONITORING/dashboard.html
@unclutter -idle 0
```

## Anpassungen & Erweiterungen

### Zusätzliche Informationen anzeigen

Sie können weitere Metriken hinzufügen, indem Sie die `createServiceCard()`-Funktion in `dashboard.html` erweitern:

```javascript
<div class="detail-item">
    <div class="detail-label">Ihre Metrik</div>
    <div class="detail-value">${service.ihreMetrik || '--'}</div>
</div>
```

### Farben anpassen

Ändern Sie die CSS-Variablen in `dashboard.html`:

```css
.status-badge.online {
    background: #10b981;  /* Ihre Farbe */
}
```

### Grid-Layout anpassen

Für mehr/weniger Spalten:

```css
.services-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## Sicherheitshinweise

- **Niemals** den API-Token in öffentliche Repositories committen
- Verwenden Sie `.gitignore` um `config.local.js` auszuschließen
- Bei Produktions-Deployment: Token über Umgebungsvariablen laden
- Regelmäßig API-Token rotieren

## Support & Weiterentwicklung

### Geplante Features

- [ ] Historische Daten und Trends
- [ ] Alarm-Benachrichtigungen
- [ ] Export-Funktionen (CSV, PDF)
- [ ] Dark/Light Mode Toggle
- [ ] Multi-Standort-Ansicht mit Karte
- [ ] Detaillierte Drill-Down-Ansichten

### Probleme melden

Bei Problemen oder Feature-Requests erstellen Sie bitte ein Issue im Repository.

## Lizenz

Dieses Projekt ist für den internen Gebrauch in der IT-Abteilung bestimmt.

## Changelog

### Version 1.0.0 (2025-10-28)
- Initiales Release
- Basis-Dashboard mit Starlink-Monitoring
- Auto-Refresh-Funktionalität
- Mock-Daten für Entwicklung
- TV-Display-Optimierung
