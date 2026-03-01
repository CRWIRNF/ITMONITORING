import axios from 'axios';
import { StarlinkHistoryModel } from '../models/StarlinkHistory';

interface UserTerminal {
  id: string;
  kitSerialNumber: string;
  dishSerialNumber: string;
  active: boolean;
}

interface MonthlyUsage {
  totalStandardGb: number;
  totalPriorityGb: number;
  totalOptInPriorityGb: number;
  totalNonBillableGb: number;
  includedGb: number;
  startDate: string;
  endDate: string;
}

interface ServiceLine {
  id: string;
  name: string;
  nickname: string;
  status: string;
  monthlyUsage: MonthlyUsage[];
  userTerminals: UserTerminal[];
}

interface StarlinkApiResponse {
  serviceLines: ServiceLine[];
  total: number;
}

export class StarlinkService {
  private apiUrl: string;
  private bearerToken: string;

  constructor() {
    this.apiUrl = process.env.STARLINK_API_URL || 'https://portal.apps.castormarine.com/api';
    this.bearerToken = process.env.STARLINK_BEARER_TOKEN || '';
  }

  async getServiceLines(): Promise<StarlinkApiResponse | null> {
    try {
      if (!this.bearerToken) {
        throw new Error('STARLINK_BEARER_TOKEN ist nicht konfiguriert. Bitte setzen Sie den Token in der .env Datei.');
      }

      const response = await axios.get<StarlinkApiResponse>(
        `${this.apiUrl}/service-lines`,
        {
          headers: {
            'Accept': 'application/json, application/problem+json',
            'Authorization': `Bearer ${this.bearerToken}`
          },
          timeout: 15000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('❌ Starlink API: 401 Unauthorized - Token ist abgelaufen oder ungültig!');
        console.error('   Bitte erneuern Sie den STARLINK_BEARER_TOKEN in der .env Datei.');
        console.error('   Anleitung: https://portal.apps.castormarine.com/');
      } else if (error.response?.status === 403) {
        console.error('❌ Starlink API: 403 Forbidden - Zugriff verweigert!');
      } else if (error.code === 'ECONNABORTED') {
        console.error('❌ Starlink API: Timeout nach 15 Sekunden');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('❌ Starlink API: Verbindung fehlgeschlagen - API nicht erreichbar');
      } else {
        console.error('❌ Fehler beim Abrufen der Starlink-Daten:', error.message);
      }
      throw error;
    }
  }

  /**
   * Konvertiert die API-Daten in ein vereinfachtes Format für das Frontend
   * Verwendet lokale historische Daten aus der Datenbank
   */
  async getFormattedServiceLines() {
    const data = await this.getServiceLines();

    if (!data) {
      return [];
    }

    // Lade alle historischen Daten aus der Datenbank
    const historyMap = await StarlinkHistoryModel.getAllShipsLatestHistory(12);

    return data.serviceLines.map(line => {
      const currentUsage = line.monthlyUsage[0] || {};
      const totalUsedGb = (currentUsage.totalStandardGb || 0) + (currentUsage.totalPriorityGb || 0);
      const includedGb = currentUsage.includedGb || 1000;
      const usagePercentage = (totalUsedGb / includedGb) * 100;

      // Extrahiere Schiffsname aus dem vollständigen Namen
      const shipMatch = line.name.match(/^([A-Z\s]+(?:[IVX]+)?)/);
      const shipName = shipMatch ? shipMatch[1].trim() : line.name;

      // Hole historische Daten aus der lokalen Datenbank
      const dbHistory = historyMap.get(line.id) || [];

      let monthlyHistory;
      if (dbHistory.length > 0) {
        // Verwende lokale historische Daten
        monthlyHistory = dbHistory.map(entry => ({
          period: new Date(entry.period_start).toLocaleDateString('de-DE', { year: 'numeric', month: 'short' }),
          totalGb: Math.round((Number(entry.total_standard_gb) + Number(entry.total_priority_gb)) * 100) / 100,
          standardGb: Math.round(Number(entry.total_standard_gb) * 100) / 100,
          priorityGb: Math.round(Number(entry.total_priority_gb) * 100) / 100,
          includedGb: entry.included_gb,
          startDate: entry.period_start.toISOString(),
          endDate: entry.period_end.toISOString()
        }));
      } else {
        // Fallback: Verwende API-Daten wenn keine lokalen Daten vorhanden sind
        monthlyHistory = line.monthlyUsage.slice(0, 12).map(month => ({
          period: new Date(month.startDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'short' }),
          totalGb: Math.round(((month.totalStandardGb || 0) + (month.totalPriorityGb || 0)) * 100) / 100,
          standardGb: Math.round((month.totalStandardGb || 0) * 100) / 100,
          priorityGb: Math.round((month.totalPriorityGb || 0) * 100) / 100,
          includedGb: month.includedGb || 1000,
          startDate: month.startDate,
          endDate: month.endDate
        }));
      }

      return {
        id: line.id,
        name: shipName,
        fullName: line.name,
        status: line.status === 'active' ? 'online' : 'offline',
        usedGb: Math.round(totalUsedGb * 100) / 100,
        totalGb: includedGb,
        usagePercentage: Math.round(usagePercentage * 10) / 10,
        kitSerialNumber: line.userTerminals[0]?.kitSerialNumber || 'N/A',
        dishSerialNumber: line.userTerminals[0]?.dishSerialNumber || 'N/A',
        terminalActive: line.userTerminals[0]?.active || false,
        lastUpdated: new Date().toISOString(),
        period: {
          start: currentUsage.startDate,
          end: currentUsage.endDate
        },
        monthlyHistory
      };
    });
  }
}

export const starlinkService = new StarlinkService();
