import api from './api';

export interface NinjaDevice {
  id: number;
  name: string;
  status: 'online' | 'offline';
  type: string;
  lastContact: number;
  organizationId: number;
  locationId: number;
}

export interface NinjaOrganization {
  id: number;
  name: string;
  description?: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  tags?: string[];
}

export interface NinjaHealth {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
}

export const ninjaService = {
  /**
   * Ruft alle Geräte ab
   */
  async getDevices(): Promise<NinjaDevice[]> {
    const response = await api.get<{ success: boolean; data: NinjaDevice[] }>('/ninja/devices');
    return response.data.data;
  },

  /**
   * Ruft ein einzelnes Gerät ab
   */
  async getDevice(deviceId: number): Promise<NinjaDevice> {
    const response = await api.get<{ success: boolean; data: NinjaDevice }>(`/ninja/devices/${deviceId}`);
    return response.data.data;
  },

  /**
   * Ruft alle Organisationen ab
   */
  async getOrganizations(): Promise<NinjaOrganization[]> {
    const response = await api.get<{ success: boolean; data: NinjaOrganization[] }>('/ninja/organizations');
    return response.data.data;
  },

  /**
   * Health-Check für NinjaOne API
   */
  async healthCheck(): Promise<NinjaHealth> {
    const response = await api.get<NinjaHealth>('/ninja/health');
    return response.data;
  },

  /**
   * Formatiert den lastContact Timestamp in ein lesbares Format
   */
  formatLastContact(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays < 7) return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Bestimmt die Farbe basierend auf dem Status
   */
  getStatusColor(status: 'online' | 'offline'): string {
    return status === 'online' ? 'green' : 'gray';
  },

  /**
   * Gruppiert Geräte nach Organisation
   */
  groupDevicesByOrganization(devices: NinjaDevice[]): Map<number, NinjaDevice[]> {
    const grouped = new Map<number, NinjaDevice[]>();

    devices.forEach(device => {
      if (!grouped.has(device.organizationId)) {
        grouped.set(device.organizationId, []);
      }
      grouped.get(device.organizationId)!.push(device);
    });

    return grouped;
  }
};
