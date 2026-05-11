import { Response } from 'express';
import { MonitoringDataModel } from '../models/MonitoringData';
import { AuthRequest } from '../middleware/auth';
import { starlinkService } from '../services/starlinkService';
import { websiteMonitoringService } from '../services/websiteMonitoringService';
import { ticketingService } from '../services/ticketingService';
import { TicketStatsModel } from '../models/TicketStats';

// Cache für Ticketing-Daten (5 Minuten Gültigkeit)
interface TicketingCache {
  data: any;
  timestamp: number;
}

let ticketingCache: TicketingCache | null = null;
let topCreatorsCache: TicketingCache | null = null;
let ticketHistoryCache: TicketingCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten in Millisekunden

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await MonitoringDataModel.getDashboardSummary();

    // Hole echte Starlink-Daten von der API
    try {
      const starlinkData = await starlinkService.getFormattedServiceLines();

      // Aktualisiere oder erstelle den Starlink-Eintrag in der Zusammenfassung
      const starlinkIndex = summary.findIndex(s => s.service_type === 'starlink');
      const onlineCount = starlinkData.filter(ship => ship.status === 'online').length;
      const offlineCount = starlinkData.filter(ship => ship.status === 'offline').length;

      const starlinkSummary = {
        service_type: 'starlink',
        total_services: starlinkData.length,
        online: onlineCount,
        offline: offlineCount,
        warning: 0,
        error: 0,
        avg_response_time: null
      };

      if (starlinkIndex >= 0) {
        summary[starlinkIndex] = starlinkSummary;
      } else {
        summary.push(starlinkSummary);
      }
    } catch (starlinkError) {
      console.error('Fehler beim Abrufen der Starlink-Daten für Dashboard:', starlinkError);
      // Weiter mit bestehenden Daten, wenn Starlink-API fehlschlägt
    }

    // Hole echte Website-Daten
    try {
      const websiteData = await websiteMonitoringService.getWebsiteStatusWithStats();

      const websiteIndex = summary.findIndex(s => s.service_type === 'website');
      const onlineCount = websiteData.filter(site => site.currentStatus === 'online').length;
      const offlineCount = websiteData.filter(site => site.currentStatus === 'offline').length;

      // Berechne durchschnittliche Antwortzeit
      const avgResponseTime = websiteData.length > 0
        ? websiteData.reduce((sum, site) => sum + site.stats24h.avgResponseTime, 0) / websiteData.length
        : 0;

      const websiteSummary = {
        service_type: 'website',
        total_services: websiteData.length,
        online: onlineCount,
        offline: offlineCount,
        warning: 0,
        error: 0,
        avg_response_time: Math.round(avgResponseTime)
      };

      if (websiteIndex >= 0) {
        summary[websiteIndex] = websiteSummary;
      } else {
        summary.push(websiteSummary);
      }
    } catch (websiteError) {
      console.error('Fehler beim Abrufen der Website-Daten für Dashboard:', websiteError);
      // Weiter mit bestehenden Daten, wenn Website-Abfrage fehlschlägt
    }

    // Hole echte Ticketing-Daten
    try {
      const ticketingStats = await ticketingService.getTicketingStats();

      const ticketingIndex = summary.findIndex(s => s.service_type === 'ticketsystem');
      const ticketingSummary = {
        service_type: 'ticketsystem',
        total_services: ticketingStats.totalTickets,
        online: ticketingStats.openTickets,
        offline: ticketingStats.closedTickets,
        warning: ticketingStats.unassignedTickets > 5 ? ticketingStats.unassignedTickets : 0,
        error: ticketingStats.unassignedTickets > 10 ? ticketingStats.unassignedTickets : 0,
        avg_response_time: null
      };

      if (ticketingIndex >= 0) {
        summary[ticketingIndex] = ticketingSummary;
      } else {
        summary.push(ticketingSummary);
      }
    } catch (ticketingError) {
      console.error('Fehler beim Abrufen der Ticketing-Daten für Dashboard:', ticketingError);
      // Weiter mit bestehenden Daten, wenn Ticketing-API fehlschlägt
    }

    res.json({ summary });
  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getStarlinkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const data = await MonitoringDataModel.getLatestByType('starlink');
    res.json({ data });
  } catch (error) {
    console.error('Starlink-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getTicketsystemStatus = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Prüfe Cache (5 Minuten Gültigkeit)
    const now = Date.now();
    if (ticketingCache && (now - ticketingCache.timestamp) < CACHE_DURATION) {
      console.log('✓ Ticketing-Daten aus Cache geliefert');
      return res.json({ data: ticketingCache.data });
    }

    // 2. Hole Daten aus der Datenbank (von letztem Snapshot)
    const [snapshot, creationStats, closureStats] = await Promise.all([
      TicketStatsModel.getLatestSnapshot(),
      TicketStatsModel.getTicketCreationStats(),
      TicketStatsModel.getTicketClosureStats()
    ]);

    // 3. Wenn kein Snapshot vorhanden oder zu alt (> 35 Min), hole von NinjaOne
    if (!snapshot || (now - new Date(snapshot.snapshot_time).getTime()) > 35 * 60 * 1000) {
      console.log('⚠️  Kein aktueller Snapshot verfügbar, hole Daten von NinjaOne...');
      const [ticketingStats, liveCreationStats, liveClosureStats] = await Promise.all([
        ticketingService.getTicketingStats(),
        ticketingService.getTicketCreationStats(),
        ticketingService.getTicketClosureStats()
      ]);

      const responseData = {
        service_type: 'ticketsystem',
        service_name: 'NinjaOne Ticketing',
        status: ticketingStats.status,
        message: ticketingStats.message,
        details: {
          total: ticketingStats.totalTickets,
          open: ticketingStats.openTickets,
          closed: ticketingStats.closedTickets,
          unassigned: ticketingStats.unassignedTickets,
          myTickets: ticketingStats.myTickets,
          boards: ticketingStats.boards,
          creationStats: liveCreationStats,
          closureStats: liveClosureStats
        }
      };

      // Cache aktualisieren
      ticketingCache = { data: responseData, timestamp: now };

      return res.json({ data: responseData });
    }

    // 4. Verwende Daten aus Snapshot
    console.log('✓ Ticketing-Daten aus Snapshot geliefert');

    // Hole aktuelle Boards für Status-Berechnung
    const ticketingStats = await ticketingService.getTicketingStats();

    const responseData = {
      service_type: 'ticketsystem',
      service_name: 'NinjaOne Ticketing',
      status: ticketingStats.status,
      message: ticketingStats.message,
      details: {
        total: snapshot.total_tickets,
        open: snapshot.open_tickets,
        closed: snapshot.closed_tickets,
        unassigned: snapshot.unassigned_tickets,
        myTickets: ticketingStats.myTickets,
        boards: ticketingStats.boards,
        creationStats,
        closureStats
      }
    };

    // Cache aktualisieren
    ticketingCache = { data: responseData, timestamp: now };

    res.json({ data: responseData });
  } catch (error) {
    console.error('Ticketsystem-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getTicketTrend = async (req: AuthRequest, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const trend = await TicketStatsModel.getMonthlyTrend(months);

    const germanMonths = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    const formatted = trend.map(entry => ({
      period: `${entry.year}-${String(entry.month).padStart(2, '0')}`,
      label: `${germanMonths[entry.month - 1]} ${entry.year}`,
      total: entry.total_tickets,
      open: entry.open_tickets,
      created: entry.created_tickets,
      closed: entry.closed_tickets
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error('Ticket-Trend-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getTopTicketCreators = async (req: AuthRequest, res: Response) => {
  try {
    const now = Date.now();
    if (topCreatorsCache && (now - topCreatorsCache.timestamp) < CACHE_DURATION) {
      return res.json({ data: topCreatorsCache.data });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const data = await ticketingService.getTopTicketCreators(limit);

    topCreatorsCache = { data, timestamp: now };
    res.json({ data });
  } catch (error) {
    console.error('Top-Ticket-Ersteller-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getTicketHistory = async (req: AuthRequest, res: Response) => {
  try {
    const now = Date.now();
    if (ticketHistoryCache && (now - ticketHistoryCache.timestamp) < CACHE_DURATION) {
      return res.json({ data: ticketHistoryCache.data });
    }

    const data = await ticketingService.getTicketHistory();

    ticketHistoryCache = { data, timestamp: now };
    res.json({ data });
  } catch (error) {
    console.error('Ticket-Historie-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getFirewallStatus = async (req: AuthRequest, res: Response) => {
  try {
    const data = await MonitoringDataModel.getLatestByType('firewall');
    res.json({ data });
  } catch (error) {
    console.error('Firewall-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getWebsiteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const data = await MonitoringDataModel.getLatestByType('website');
    res.json({ data });
  } catch (error) {
    console.error('Website-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateMonitoringData = async (req: AuthRequest, res: Response) => {
  try {
    const { service_type, service_name, status, response_time, details } = req.body;

    if (!service_type || !service_name || !status) {
      return res.status(400).json({ error: 'service_type, service_name und status sind erforderlich' });
    }

    const data = await MonitoringDataModel.upsert({
      service_type,
      service_name,
      status,
      response_time,
      details
    });

    res.json({ data });
  } catch (error) {
    console.error('Update-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
