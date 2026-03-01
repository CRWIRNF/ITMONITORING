import api from './api';

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
}

export interface SystemMetricsHistory {
  id: number;
  cpu_usage: number;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  created_at: string;
}

export interface LoginHistoryEntry {
  id: number;
  user_id: number;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

export const systemService = {
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const response = await api.get('/system/metrics/current');
    return response.data.data;
  },

  async getMetricsHistory(hours: number = 24): Promise<SystemMetricsHistory[]> {
    const response = await api.get(`/system/metrics/history?hours=${hours}`);
    return response.data.data;
  },

  async getLoginHistory(limit: number = 10): Promise<LoginHistoryEntry[]> {
    const response = await api.get(`/system/logins?limit=${limit}`);
    return response.data.data;
  }
};
