import axios from 'axios';

const API_URL = '/api';

export interface WebsiteHistoryEntry {
  status: 'online' | 'offline';
  responseTime: number;
  timestamp: string;
  statusCode?: number;
}

export interface WebsiteStats24h {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  uptimePercentage: number;
}

export interface Website {
  id: number;
  url: string;
  name: string;
  enabled: boolean;
  currentStatus: 'online' | 'offline' | 'unknown';
  currentResponseTime: number;
  lastCheck: string | null;
  stats24h: WebsiteStats24h;
  history24h: WebsiteHistoryEntry[];
}

export interface WebsitesResponse {
  success: boolean;
  data: Website[];
}

export const websiteService = {
  async getWebsites(): Promise<Website[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get<WebsitesResponse>(`${API_URL}/websites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  async addWebsite(website: { url: string; name: string; enabled: boolean; check_interval: number }): Promise<Website> {
    const token = localStorage.getItem('token');
    const response = await axios.post<{ success: boolean; data: Website }>(`${API_URL}/websites`, website, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  async triggerCheck(): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/websites/check`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
