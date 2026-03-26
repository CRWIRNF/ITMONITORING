import { ninjaService } from './ninjaService';
import { TicketStatsModel, TicketCreationStats, TicketClosureStats } from '../models/TicketStats';

interface TicketBoard {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  system: boolean;
  ticketCount: number;
}

interface TicketingStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  unassignedTickets: number;
  myTickets: number;
  boards: TicketBoard[];
  status: 'ok' | 'warning' | 'error';
  message: string;
}

export class TicketingService {
  /**
   * Ruft alle Ticket-Boards von NinjaOne ab
   */
  async getTicketBoards(): Promise<TicketBoard[]> {
    try {
      const token = await (ninjaService as any).getAccessToken();
      const axios = require('axios');

      const response = await axios.get(
        `${(ninjaService as any).apiUrl}/v2/ticketing/trigger/boards`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Ticket-Boards:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Erstellt eine Statistik-Übersicht über alle Tickets
   */
  async getTicketingStats(): Promise<TicketingStats> {
    try {
      const boards = await this.getTicketBoards();

      // Finde spezifische Boards für die Statistik
      const allTicketsBoard = boards.find(b => b.name === 'Alle Tickets');
      const openTicketsBoard = boards.find(b => b.name === 'Offene Tickets');
      const closedTicketsBoard = boards.find(b => b.name === 'Geschlossene Tickets');
      const unassignedBoard = boards.find(b => b.name === 'Nicht zugewiesene Tickets');
      const myTicketsBoard = boards.find(b => b.name === 'Meine Tickets');

      const totalTickets = allTicketsBoard?.ticketCount || 0;
      const openTickets = openTicketsBoard?.ticketCount || 0;
      const closedTickets = closedTicketsBoard?.ticketCount || 0;
      const unassignedTickets = unassignedBoard?.ticketCount || 0;
      const myTickets = myTicketsBoard?.ticketCount || 0;

      // Bestimme den Status basierend auf unzugewiesenen Tickets
      let status: 'ok' | 'warning' | 'error' = 'ok';
      let message = 'Ticketsystem läuft normal';

      if (unassignedTickets > 10) {
        status = 'error';
        message = `${unassignedTickets} nicht zugewiesene Tickets!`;
      } else if (unassignedTickets > 5) {
        status = 'warning';
        message = `${unassignedTickets} nicht zugewiesene Tickets`;
      } else if (openTickets > 50) {
        status = 'warning';
        message = `${openTickets} offene Tickets`;
      }

      return {
        totalTickets,
        openTickets,
        closedTickets,
        unassignedTickets,
        myTickets,
        boards: boards.map(board => ({
          id: board.id,
          uid: board.uid,
          name: board.name,
          description: board.description,
          system: board.system,
          ticketCount: board.ticketCount
        })),
        status,
        message
      };
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Ticketing-Statistik:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        unassignedTickets: 0,
        myTickets: 0,
        boards: [],
        status: 'error',
        message: `Fehler beim Abrufen der Ticketing-Daten: ${error.message}`
      };
    }
  }

  /**
   * Ruft alle Tickets von einem Board ab
   */
  private async getTicketsFromBoard(boardId: number, pageSize: number = 1000, sortDescending: boolean = false): Promise<any[]> {
    try {
      const token = await (ninjaService as any).getAccessToken();
      const axios = require('axios');

      const requestBody: any = { pageSize };

      // Wenn sortDescending true ist, sortiere nach ID absteigend (neueste zuerst)
      if (sortDescending) {
        requestBody.sortBy = [
          {
            field: 'id',
            direction: 'DESC'
          }
        ];
      }

      const response = await axios.post(
        `${(ninjaService as any).apiUrl}/v2/ticketing/trigger/board/${boardId}/run`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error(`Fehler beim Abrufen der Tickets von Board ${boardId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ruft die Ticket-Erstellungs-Statistiken ab (basierend auf tatsächlichen createTime-Werten)
   */
  async getTicketCreationStats(): Promise<TicketCreationStats> {
    try {
      // Hole alle Tickets vom "Alle Tickets" Board (Board ID 2)
      const tickets = await this.getTicketsFromBoard(2);

      // Berechne Zeitgrenzen
      const now = new Date();

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayStartUnix = todayStart.getTime() / 1000;

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Montag
      weekStart.setHours(0, 0, 0, 0);
      const weekStartUnix = weekStart.getTime() / 1000;

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthStartUnix = monthStart.getTime() / 1000;

      // Vormonat (1. bis letzter Tag des Vormonats)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthStartUnix = lastMonthStart.getTime() / 1000;
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastMonthEndUnix = lastMonthEnd.getTime() / 1000;

      // Zähle Tickets nach Erstellungszeit
      const today = tickets.filter(t => t.createTime >= todayStartUnix).length;
      const thisWeek = tickets.filter(t => t.createTime >= weekStartUnix).length;
      const thisMonth = tickets.filter(t => t.createTime >= monthStartUnix).length;
      const lastMonth = tickets.filter(t => t.createTime >= lastMonthStartUnix && t.createTime < lastMonthEndUnix).length;

      console.log(`Ticket Creation Stats: Heute=${today}, Woche=${thisWeek}, Monat=${thisMonth}, Vormonat=${lastMonth}`);

      return { today, thisWeek, thisMonth, lastMonth };
    } catch (error: any) {
      console.error('Fehler beim Berechnen der Erstellungs-Statistiken:', error);
      return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 };
    }
  }

  /**
   * Ruft die Log-Einträge eines Tickets ab
   */
  private async getTicketLogEntries(ticketId: number): Promise<any[]> {
    try {
      const token = await (ninjaService as any).getAccessToken();
      const axios = require('axios');

      const response = await axios.get(
        `${(ninjaService as any).apiUrl}/v2/ticketing/ticket/${ticketId}/log-entry`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data || [];
    } catch (error: any) {
      console.error(`Fehler beim Abrufen der Log-Einträge für Ticket ${ticketId}:`, error.message);
      return [];
    }
  }

  /**
   * Findet den Zeitpunkt, wann ein Ticket geschlossen/aufgelöst wurde
   */
  private async getTicketCloseTime(ticketId: number): Promise<number | null> {
    try {
      const logEntries = await this.getTicketLogEntries(ticketId);

      // Suche nach einem Log-Eintrag, der den Status zu "Aufgelöst" oder "Geschlossen" ändert
      // "Aufgelöst" ist der erste Schritt (Ticket gelöst), "Geschlossen" ist der finale Status
      for (const entry of logEntries) {
        const newStatus = entry.changeDiff?.status?.new;
        if (newStatus === 'Aufgelöst' || newStatus === 'Geschlossen') {
          return entry.createTime;
        }
      }

      return null;
    } catch (error: any) {
      console.error(`Fehler beim Ermitteln der Schließungszeit für Ticket ${ticketId}:`, error.message);
      return null;
    }
  }

  /**
   * Ruft die Ticket-Schließungs-Statistiken ab (basierend auf Log-Einträgen der letzten Tickets)
   */
  async getTicketClosureStats(): Promise<TicketClosureStats> {
    try {
      // Hole ALLE Tickets vom "Alle Tickets" Board (Board ID 2)
      // Sortiere nach ID absteigend, um die neuesten Tickets zu bekommen
      const allTickets = await this.getTicketsFromBoard(2, 1000, true);

      // Filtere nur Tickets mit Status "Aufgelöst" oder "Geschlossen"
      const closedOrResolvedTickets = allTickets.filter(ticket => {
        const status = ticket.status?.displayName;
        return status === 'Aufgelöst' || status === 'Geschlossen';
      });

      console.log(`Analysiere ${closedOrResolvedTickets.length} geschlossene/aufgelöste Tickets (von ${allTickets.length} Tickets)...`);

      // Sammle die Schließungszeiten für ALLE geschlossenen Tickets
      // (keine Limitierung mehr - da Scheduler nur alle 30 Min läuft, ist das akzeptabel)
      const closeTimesPromises = closedOrResolvedTickets.map(ticket =>
        this.getTicketCloseTime(ticket.id)
      );

      const closeTimes = await Promise.all(closeTimesPromises);

      // Filtere null-Werte heraus
      const validCloseTimes = closeTimes.filter(time => time !== null) as number[];

      console.log(`${validCloseTimes.length} von ${closedOrResolvedTickets.length} Tickets haben eine Schließungszeit`);

      // Berechne Zeitgrenzen
      const now = new Date();

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayStartUnix = todayStart.getTime() / 1000;

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Montag
      weekStart.setHours(0, 0, 0, 0);
      const weekStartUnix = weekStart.getTime() / 1000;

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const monthStartUnix = monthStart.getTime() / 1000;

      // Vormonat (1. bis letzter Tag des Vormonats)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthStartUnix = lastMonthStart.getTime() / 1000;
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastMonthEndUnix = lastMonthEnd.getTime() / 1000;

      // Zähle Tickets nach Schließungszeit
      const today = validCloseTimes.filter(t => t >= todayStartUnix).length;
      const thisWeek = validCloseTimes.filter(t => t >= weekStartUnix).length;
      const thisMonth = validCloseTimes.filter(t => t >= monthStartUnix).length;
      const lastMonth = validCloseTimes.filter(t => t >= lastMonthStartUnix && t < lastMonthEndUnix).length;

      console.log(`Ticket Closure Stats: Heute=${today}, Woche=${thisWeek}, Monat=${thisMonth}, Vormonat=${lastMonth}`);

      return { today, thisWeek, thisMonth, lastMonth };
    } catch (error: any) {
      console.error('Fehler beim Berechnen der Schließungs-Statistiken:', error);
      return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 };
    }
  }

  /**
   * Formatiert die Ticketing-Daten für das Dashboard
   */
  async getFormattedStats() {
    const stats = await this.getTicketingStats();

    return {
      service_type: 'ticketsystem',
      service_name: 'NinjaOne Ticketing',
      status: stats.status,
      message: stats.message,
      details: {
        total: stats.totalTickets,
        open: stats.openTickets,
        closed: stats.closedTickets,
        unassigned: stats.unassignedTickets,
        myTickets: stats.myTickets,
        boards: stats.boards
      }
    };
  }

  /**
   * Ermittelt die Top-Ticket-Ersteller (gruppiert nach requester)
   */
  async getTopTicketCreators(limit: number = 10): Promise<{ name: string; count: number }[]> {
    try {
      const tickets = await this.getTicketsFromBoard(2);

      const creatorMap = new Map<string, number>();
      for (const ticket of tickets) {
        const name = ticket.requester;
        if (name) {
          creatorMap.set(name, (creatorMap.get(name) || 0) + 1);
        }
      }

      return Array.from(creatorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error: any) {
      console.error('Fehler beim Ermitteln der Top-Ticket-Ersteller:', error);
      return [];
    }
  }

  /**
   * Health-Check: Testet ob die Ticketing-API erreichbar ist
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error', message: string }> {
    try {
      const boards = await this.getTicketBoards();
      return {
        status: 'ok',
        message: `Ticketsystem verbunden (${boards.length} Boards gefunden)`
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Ticketsystem nicht erreichbar: ${error.message}`
      };
    }
  }
}

export const ticketingService = new TicketingService();
