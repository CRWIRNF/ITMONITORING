import api from './api';

export interface MonthlyHistoryEntry {
  period: string;
  totalGb: number;
  standardGb: number;
  priorityGb: number;
  includedGb: number;
  startDate: string;
  endDate: string;
}

export interface StarlinkShip {
  id: string;
  name: string;
  fullName: string;
  status: 'online' | 'offline';
  usedGb: number;
  totalGb: number;
  usagePercentage: number;
  kitSerialNumber: string;
  dishSerialNumber: string;
  terminalActive: boolean;
  lastUpdated: string;
  period: {
    start: string;
    end: string;
  };
  monthlyHistory: MonthlyHistoryEntry[];
}

export interface StarlinkResponse {
  success: boolean;
  data: StarlinkShip[];
  timestamp: string;
}

export const starlinkService = {
  async getStarlinkData(): Promise<StarlinkShip[]> {
    const response = await api.get<StarlinkResponse>('/starlink');
    return response.data.data;
  },

  async getStarlinkRawData(): Promise<any> {
    const response = await api.get('/starlink/raw');
    return response.data;
  }
};
