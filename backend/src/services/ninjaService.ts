import axios from 'axios';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface NinjaDevice {
  id: number;
  systemName: string;
  dnsName: string;
  nodeClass: string;
  nodeRoleId: number;
  online: boolean;
  lastContact: string;
  organizationId: number;
  locationId: number;
}

interface NinjaOrganization {
  id: number;
  name: string;
  description?: string;
  nodeApprovalMode: string;
  tags: string[];
}

export class NinjaService {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.apiUrl = process.env.NINJA_API_URL || 'https://eu.ninjarmm.com';
    this.clientId = process.env.NINJA_CLIENT_ID || '';
    this.clientSecret = process.env.NINJA_CLIENT_SECRET || '';
  }

  /**
   * Holt einen neuen Access Token via OAuth2 Client Credentials Flow
   */
  private async getAccessToken(): Promise<string> {
    // Prüfe ob noch ein gültiger Token vorhanden ist
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.post<TokenResponse>(
        `${this.apiUrl}/ws/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'monitoring management'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token läuft 5 Minuten vor Ablauf ab (Sicherheitsmarge)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('✓ NinjaOne Access Token erfolgreich abgerufen');
      return this.accessToken;
    } catch (error) {
      console.error('Fehler beim Abrufen des NinjaOne Access Tokens:', error);
      throw error;
    }
  }

  /**
   * Generische API-Anfrage mit automatischer Token-Verwaltung
   */
  private async apiRequest<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}/v2${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error: any) {
      console.error(`Fehler bei NinjaOne API-Request (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ruft alle Organisationen ab
   */
  async getOrganizations(): Promise<NinjaOrganization[]> {
    return this.apiRequest<NinjaOrganization[]>('/organizations');
  }

  /**
   * Ruft alle Geräte ab
   */
  async getDevices(): Promise<NinjaDevice[]> {
    return this.apiRequest<NinjaDevice[]>('/devices');
  }

  /**
   * Ruft Details zu einem spezifischen Gerät ab
   */
  async getDevice(deviceId: number): Promise<NinjaDevice> {
    return this.apiRequest<NinjaDevice>(`/device/${deviceId}`);
  }

  /**
   * Ruft alle Geräte einer Organisation ab
   */
  async getDevicesByOrganization(organizationId: number): Promise<NinjaDevice[]> {
    const allDevices = await this.getDevices();
    return allDevices.filter(device => device.organizationId === organizationId);
  }

  /**
   * Formatiert die Geräte-Daten für das Frontend
   */
  async getFormattedDevices() {
    const devices = await this.getDevices();

    return devices.map(device => ({
      id: device.id,
      name: device.systemName || device.dnsName,
      status: device.online ? 'online' : 'offline',
      type: device.nodeClass,
      lastContact: device.lastContact,
      organizationId: device.organizationId,
      locationId: device.locationId
    }));
  }

  /**
   * Gibt eine Übersicht über alle Organisationen mit Device-Counts
   */
  async getOrganizationsOverview() {
    const [organizations, devices] = await Promise.all([
      this.getOrganizations(),
      this.getDevices()
    ]);

    return organizations.map(org => {
      const orgDevices = devices.filter(d => d.organizationId === org.id);
      const onlineDevices = orgDevices.filter(d => d.online).length;

      return {
        id: org.id,
        name: org.name,
        description: org.description,
        totalDevices: orgDevices.length,
        onlineDevices,
        offlineDevices: orgDevices.length - onlineDevices,
        tags: org.tags
      };
    });
  }

  /**
   * Health-Check: Testet ob die API erreichbar ist
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error', message: string }> {
    try {
      await this.getAccessToken();
      return { status: 'ok', message: 'NinjaOne API verbunden' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}

export const ninjaService = new NinjaService();
