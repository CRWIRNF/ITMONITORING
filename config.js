// Konfigurationsdatei für das IT Monitoring Dashboard
// Diese Datei kann für einfache Anpassungen verwendet werden

const CONFIG = {
    // API-Einstellungen
    api: {
        baseUrl: 'https://portal.apps.castormarine.com/api',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTMxOTEzNzAsImlhdCI6MTc2MTY1NTM3MCwiaXNzIjoicG9ydGFsLmNhc3Rvci5ubCIsImp0aSI6IjkxMmQ3NGM0LTE5NWMtNGJjNS04OGZmLTI4OWYxM2VlYzhjMCIsInNjb3BlcyI6WyJhcGk6cmVhZCIsImFwaTp3cml0ZSJdLCJzdWIiOiJ3LmNyYW1lckByZWVkZXJlaS1mcmlzaWEuZGUifQ.3XunSuqGWOO7nlVKNP6cvOqx2DRWU2NWJ0fbE3xgdKc',
        endpoint: '/service-lines'
    },

    // Dashboard-Einstellungen
    dashboard: {
        // Aktualisierungsintervall in Millisekunden (Standard: 30 Sekunden)
        refreshInterval: 30000,

        // Titel des Dashboards
        title: 'IT Monitoring Dashboard',

        // Footer-Text
        footerText: 'IT-Abteilung | Auto-Refresh alle 30 Sekunden',

        // Mock-Daten verwenden (für Entwicklung ohne API-Zugriff)
        useMockData: false
    },

    // Schwellenwerte für Status-Bewertung
    thresholds: {
        // Signalstärke-Schwellenwerte
        signalStrength: {
            warning: 70,  // Unter diesem Wert: Warnung
            offline: 0    // Bei 0: Offline
        },

        // Latenz-Schwellenwerte (in ms)
        latency: {
            good: 50,     // Bis zu diesem Wert: Gut
            warning: 100  // Ab diesem Wert: Warnung
        },

        // Uptime-Schwellenwerte (in %)
        uptime: {
            good: 99.0,   // Ab diesem Wert: Gut
            warning: 95.0 // Unter diesem Wert: Warnung
        }
    },

    // Farb-Schema (optional)
    colors: {
        online: '#10b981',   // Grün
        offline: '#ef4444',  // Rot
        warning: '#f59e0b'   // Orange/Gelb
    },

    // Entwicklungs-Einstellungen
    development: {
        // Konsolen-Logs aktivieren
        enableLogging: true,

        // Detaillierte Fehler-Meldungen
        verboseErrors: true
    }
};

// Konfiguration exportieren (falls als Modul verwendet)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
