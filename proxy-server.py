#!/usr/bin/env python3
"""
Einfacher Proxy-Server für das IT Monitoring Dashboard
Löst CORS-Probleme beim Zugriff auf die Castor Marine API

Verwendung:
    python3 proxy-server.py

Dann öffnen Sie: http://localhost:8080/dashboard.html
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json
import sys

# API-Konfiguration
API_BASE_URL = "https://portal.apps.castormarine.com/api"
API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTMxOTEzNzAsImlhdCI6MTc2MTY1NTM3MCwiaXNzIjoicG9ydGFsLmNhc3Rvci5ubCIsImp0aSI6IjkxMmQ3NGM0LTE5NWMtNGJjNS04OGZmLTI4OWYxM2VlYzhjMCIsInNjb3BlcyI6WyJhcGk6cmVhZCIsImFwaTp3cml0ZSJdLCJzdWIiOiJ3LmNyYW1lckByZWVkZXJlaS1mcmlzaWEuZGUifQ.3XunSuqGWOO7nlVKNP6cvOqx2DRWU2NWJ0fbE3xgdKc"

class ProxyHandler(SimpleHTTPRequestHandler):
    """HTTP Request Handler mit API-Proxy-Funktionalität"""

    def end_headers(self):
        """Füge CORS-Header hinzu"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        # Proxy für API-Anfragen
        if self.path.startswith('/api/'):
            self.proxy_api_request()
        else:
            # Normale Datei-Anfragen
            SimpleHTTPRequestHandler.do_GET(self)

    def proxy_api_request(self):
        """Leite API-Anfragen an Castor Marine API weiter"""
        try:
            # Erstelle API-URL
            api_path = self.path.replace('/api/', '')
            api_url = f"{API_BASE_URL}/{api_path}"

            print(f"Proxy-Anfrage: {api_url}")

            # Erstelle Request mit Authorization Header
            req = urllib.request.Request(api_url)
            req.add_header('Accept', 'application/json, application/problem+json')
            req.add_header('Authorization', f'Bearer {API_TOKEN}')

            # Führe Request aus
            with urllib.request.urlopen(req) as response:
                data = response.read()

                # Sende Response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(data)

                print(f"✓ Erfolgreiche API-Antwort ({len(data)} bytes)")

        except urllib.error.HTTPError as e:
            error_msg = f"API-Fehler: {e.code} {e.reason}"
            print(f"✗ {error_msg}")

            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": error_msg,
                "code": e.code
            }).encode())

        except Exception as e:
            error_msg = f"Fehler: {str(e)}"
            print(f"✗ {error_msg}")

            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": error_msg
            }).encode())

    def log_message(self, format, *args):
        """Überschreibe Log-Ausgabe für bessere Lesbarkeit"""
        if not self.path.startswith('/api/'):
            sys.stdout.write("%s - [%s] %s\n" %
                           (self.address_string(),
                            self.log_date_time_string(),
                            format % args))


def run_server(port=8080):
    """Starte den Proxy-Server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHandler)

    print("\n" + "="*60)
    print("IT Monitoring Dashboard - Proxy Server")
    print("="*60)
    print(f"\n🚀 Server läuft auf: http://localhost:{port}")
    print(f"\n📊 Dashboard öffnen: http://localhost:{port}/dashboard.html")
    print(f"📊 Demo-Version: http://localhost:{port}/dashboard-demo.html")
    print("\n💡 Drücken Sie Strg+C zum Beenden\n")
    print("="*60 + "\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server beendet")
        httpd.server_close()


if __name__ == '__main__':
    # Prüfe ob Port-Argument übergeben wurde
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Fehler: Ungültiger Port '{sys.argv[1]}'")
            print("Verwendung: python3 proxy-server.py [port]")
            sys.exit(1)

    run_server(port)
