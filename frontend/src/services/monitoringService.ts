import api from './api';
import { MonitoringEntry, DashboardSummary, TicketingData, TicketTrendEntry, TicketCreatorEntry, TicketHistory } from '../types';

export const monitoringService = {
  async getDashboard(): Promise<DashboardSummary[]> {
    const response = await api.get<{ summary: DashboardSummary[] }>('/monitoring/dashboard');
    return response.data.summary;
  },

  async getStarlinkStatus(): Promise<MonitoringEntry[]> {
    const response = await api.get<{ data: MonitoringEntry[] }>('/monitoring/starlink');
    return response.data.data;
  },

  async getTicketsystemStatus(): Promise<TicketingData> {
    const response = await api.get<{ data: TicketingData }>('/monitoring/ticketsystem');
    return response.data.data;
  },

  async getTicketTrend(months: number = 12): Promise<TicketTrendEntry[]> {
    const response = await api.get<{ data: TicketTrendEntry[] }>(`/monitoring/ticketsystem/trend?months=${months}`);
    return response.data.data;
  },

  async getTopTicketCreators(): Promise<TicketCreatorEntry[]> {
    const response = await api.get<{ data: TicketCreatorEntry[] }>('/monitoring/ticketsystem/top-creators');
    return response.data.data;
  },

  async getTicketHistory(): Promise<TicketHistory> {
    const response = await api.get<{ data: TicketHistory }>('/monitoring/ticketsystem/history');
    return response.data.data;
  },

  async getFirewallStatus(): Promise<MonitoringEntry[]> {
    const response = await api.get<{ data: MonitoringEntry[] }>('/monitoring/firewalls');
    return response.data.data;
  },

  async getWebsiteStatus(): Promise<MonitoringEntry[]> {
    const response = await api.get<{ data: MonitoringEntry[] }>('/monitoring/websites');
    return response.data.data;
  },
};
