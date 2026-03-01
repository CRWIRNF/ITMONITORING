import api from './api';

export interface FirewallData {
  hostname: string;
  ip: string;
  location: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  firmwareVersion: string;
  timestamp: string;
}

export interface FirewallHistoryEntry {
  id?: number;
  firewall_ip: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  active_sessions: number;
  timestamp: string;
  created_at?: string;
}

export interface FirewallResponse {
  success: boolean;
  data: FirewallData[];
  timestamp: string;
}

export interface FirewallHistoryResponse {
  success: boolean;
  data: { [key: string]: FirewallHistoryEntry[] };
  hoursBack: number;
  timestamp: string;
}

export interface FirewallHistorySingleResponse {
  success: boolean;
  data: FirewallHistoryEntry[];
  hoursBack: number;
  timestamp: string;
}

export const firewallService = {
  async getFirewallStats(): Promise<FirewallData[]> {
    const response = await api.get<FirewallResponse>('/firewalls/stats');
    return response.data.data;
  },

  async getFirewallStatsByIp(ip: string): Promise<FirewallData> {
    const response = await api.get<{ success: boolean; data: FirewallData; timestamp: string }>(
      `/firewalls/stats/${ip}`
    );
    return response.data.data;
  },

  async getFirewallsHistory(hoursBack: number = 4): Promise<{ [key: string]: FirewallHistoryEntry[] }> {
    const response = await api.get<FirewallHistoryResponse>(
      `/firewalls/history?hours=${hoursBack}`
    );
    return response.data.data;
  },

  async getFirewallHistoryByIp(ip: string, hoursBack: number = 4): Promise<FirewallHistoryEntry[]> {
    const response = await api.get<FirewallHistorySingleResponse>(
      `/firewalls/history/${ip}?hours=${hoursBack}`
    );
    return response.data.data;
  }
};
