import pool from '../config/database';

export interface TicketStatsSnapshot {
  id: number;
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  unassigned_tickets: number;
  created_today: number;
  created_this_week: number;
  created_this_month: number;
  created_last_month: number;
  closed_today: number;
  closed_this_week: number;
  closed_this_month: number;
  closed_last_month: number;
  snapshot_time: Date;
}

export interface TicketStatsMonthly {
  id: number;
  year: number;
  month: number;
  total_tickets: number;
  open_tickets: number;
  created_tickets: number;
  closed_tickets: number;
  aggregated_at: Date;
}

export interface TicketCreationStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
}

export interface TicketClosureStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
}

export class TicketStatsModel {
  /**
   * Erstellt die Tabelle für Ticket-Statistiken
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ticket_stats_snapshots (
        id SERIAL PRIMARY KEY,
        total_tickets INTEGER NOT NULL,
        open_tickets INTEGER NOT NULL,
        closed_tickets INTEGER NOT NULL,
        unassigned_tickets INTEGER NOT NULL,
        created_today INTEGER DEFAULT 0,
        created_this_week INTEGER DEFAULT 0,
        created_this_month INTEGER DEFAULT 0,
        created_last_month INTEGER DEFAULT 0,
        closed_today INTEGER DEFAULT 0,
        closed_this_week INTEGER DEFAULT 0,
        closed_this_month INTEGER DEFAULT 0,
        closed_last_month INTEGER DEFAULT 0,
        snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_ticket_stats_time ON ticket_stats_snapshots(snapshot_time);
    `;
    await pool.query(query);
  }

  /**
   * Speichert einen Snapshot der aktuellen Ticket-Statistiken
   */
  static async saveSnapshot(stats: {
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    unassignedTickets: number;
    creationStats?: TicketCreationStats;
    closureStats?: TicketClosureStats;
  }): Promise<void> {
    const query = `
      INSERT INTO ticket_stats_snapshots (
        total_tickets, open_tickets, closed_tickets, unassigned_tickets,
        created_today, created_this_week, created_this_month, created_last_month,
        closed_today, closed_this_week, closed_this_month, closed_last_month
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
    await pool.query(query, [
      stats.totalTickets,
      stats.openTickets,
      stats.closedTickets,
      stats.unassignedTickets,
      stats.creationStats?.today || 0,
      stats.creationStats?.thisWeek || 0,
      stats.creationStats?.thisMonth || 0,
      stats.creationStats?.lastMonth || 0,
      stats.closureStats?.today || 0,
      stats.closureStats?.thisWeek || 0,
      stats.closureStats?.thisMonth || 0,
      stats.closureStats?.lastMonth || 0
    ]);
  }

  /**
   * Holt den neuesten Snapshot aus der Datenbank
   */
  static async getLatestSnapshot(): Promise<TicketStatsSnapshot | null> {
    const query = `
      SELECT * FROM ticket_stats_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Holt die Ticket-Closure-Stats aus dem neuesten Snapshot
   */
  static async getTicketClosureStats(): Promise<TicketClosureStats> {
    const snapshot = await this.getLatestSnapshot();
    if (!snapshot) {
      return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 };
    }
    return {
      today: snapshot.closed_today,
      thisWeek: snapshot.closed_this_week,
      thisMonth: snapshot.closed_this_month,
      lastMonth: snapshot.closed_last_month
    };
  }

  /**
   * ALTE METHODE - Berechnet die geschlossenen Tickets basierend auf Snapshots (wird nicht mehr verwendet)
   */
  static async getTicketClosureStatsOld(): Promise<TicketClosureStats> {
    const now = new Date();

    // Heute (seit Mitternacht)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Diese Woche (seit Montag)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Dieser Monat (seit 1.)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Vormonat (1. bis letzter Tag des Vormonats)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Hole die Snapshots
    const todayQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const weekQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const monthQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const lastMonthStartQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const lastMonthEndQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const currentQuery = `
      SELECT closed_tickets
      FROM ticket_stats_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `;

    try {
      const [todayResult, weekResult, monthResult, lastMonthStartResult, lastMonthEndResult, currentResult] = await Promise.all([
        pool.query(todayQuery, [todayStart]),
        pool.query(weekQuery, [weekStart]),
        pool.query(monthQuery, [monthStart]),
        pool.query(lastMonthStartQuery, [lastMonthStart]),
        pool.query(lastMonthEndQuery, [lastMonthEnd]),
        pool.query(currentQuery)
      ]);

      const currentClosed = currentResult.rows[0]?.closed_tickets || 0;
      const todayStart_closed = todayResult.rows[0]?.closed_tickets || currentClosed;
      const weekStart_closed = weekResult.rows[0]?.closed_tickets || currentClosed;
      const monthStart_closed = monthResult.rows[0]?.closed_tickets || currentClosed;
      const lastMonthStart_closed = lastMonthStartResult.rows[0]?.closed_tickets || 0;
      const lastMonthEnd_closed = lastMonthEndResult.rows[0]?.closed_tickets || lastMonthStart_closed;

      return {
        today: Math.max(0, currentClosed - todayStart_closed),
        thisWeek: Math.max(0, currentClosed - weekStart_closed),
        thisMonth: Math.max(0, currentClosed - monthStart_closed),
        lastMonth: Math.max(0, lastMonthEnd_closed - lastMonthStart_closed)
      };
    } catch (error) {
      console.error('Fehler beim Berechnen der Ticket-Schließungs-Statistiken:', error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    }
  }

  /**
   * Holt die Ticket-Creation-Stats aus dem neuesten Snapshot
   */
  static async getTicketCreationStats(): Promise<TicketCreationStats> {
    const snapshot = await this.getLatestSnapshot();
    if (!snapshot) {
      return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 };
    }
    return {
      today: snapshot.created_today,
      thisWeek: snapshot.created_this_week,
      thisMonth: snapshot.created_this_month,
      lastMonth: snapshot.created_last_month
    };
  }

  /**
   * ALTE METHODE - Berechnet die erstellten Tickets basierend auf Snapshots (wird nicht mehr verwendet)
   */
  static async getTicketCreationStatsOld(): Promise<TicketCreationStats> {
    const now = new Date();

    // Heute (seit Mitternacht)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Diese Woche (seit Montag)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Dieser Monat (seit 1.)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Vormonat
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Hole die Snapshots
    const todayQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const weekQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const monthQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const lastMonthStartQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const lastMonthEndQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      WHERE snapshot_time >= $1
      ORDER BY snapshot_time ASC
      LIMIT 1
    `;

    const currentQuery = `
      SELECT total_tickets
      FROM ticket_stats_snapshots
      ORDER BY snapshot_time DESC
      LIMIT 1
    `;

    try {
      const [todayResult, weekResult, monthResult, lastMonthStartResult, lastMonthEndResult, currentResult] = await Promise.all([
        pool.query(todayQuery, [todayStart]),
        pool.query(weekQuery, [weekStart]),
        pool.query(monthQuery, [monthStart]),
        pool.query(lastMonthStartQuery, [lastMonthStart]),
        pool.query(lastMonthEndQuery, [lastMonthEnd]),
        pool.query(currentQuery)
      ]);

      const currentTotal = currentResult.rows[0]?.total_tickets || 0;
      const todayStart_total = todayResult.rows[0]?.total_tickets || currentTotal;
      const weekStart_total = weekResult.rows[0]?.total_tickets || currentTotal;
      const monthStart_total = monthResult.rows[0]?.total_tickets || currentTotal;
      const lastMonthStart_total = lastMonthStartResult.rows[0]?.total_tickets || 0;
      const lastMonthEnd_total = lastMonthEndResult.rows[0]?.total_tickets || lastMonthStart_total;

      return {
        today: Math.max(0, currentTotal - todayStart_total),
        thisWeek: Math.max(0, currentTotal - weekStart_total),
        thisMonth: Math.max(0, currentTotal - monthStart_total),
        lastMonth: Math.max(0, lastMonthEnd_total - lastMonthStart_total)
      };
    } catch (error) {
      console.error('Fehler beim Berechnen der Ticket-Erstellungs-Statistiken:', error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    }
  }

  /**
   * Löscht alte Snapshots (älter als 90 Tage)
   */
  static async cleanupOldSnapshots(): Promise<void> {
    const query = `
      DELETE FROM ticket_stats_snapshots
      WHERE snapshot_time < NOW() - INTERVAL '90 days'
    `;
    await pool.query(query);
  }

  /**
   * Gibt alle Snapshots zurück (für Debugging)
   */
  static async getAllSnapshots(limit: number = 100): Promise<TicketStatsSnapshot[]> {
    const query = `
      SELECT * FROM ticket_stats_snapshots
      ORDER BY snapshot_time DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Erstellt die monatliche Aggregationstabelle
   */
  static async createMonthlyTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ticket_stats_monthly (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_tickets INTEGER NOT NULL DEFAULT 0,
        open_tickets INTEGER NOT NULL DEFAULT 0,
        created_tickets INTEGER NOT NULL DEFAULT 0,
        closed_tickets INTEGER NOT NULL DEFAULT 0,
        aggregated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (year, month)
      );

      CREATE INDEX IF NOT EXISTS idx_ticket_stats_monthly_period ON ticket_stats_monthly(year, month);
    `;
    await pool.query(query);
  }

  /**
   * Aggregiert Monatsdaten aus dem letzten Snapshot eines Monats per UPSERT
   */
  static async aggregateMonth(year: number, month: number): Promise<void> {
    // Letzten Snapshot des Monats holen
    const snapshotQuery = `
      SELECT total_tickets, open_tickets, created_this_month, closed_this_month
      FROM ticket_stats_snapshots
      WHERE EXTRACT(YEAR FROM snapshot_time) = $1
        AND EXTRACT(MONTH FROM snapshot_time) = $2
      ORDER BY snapshot_time DESC
      LIMIT 1
    `;
    const result = await pool.query(snapshotQuery, [year, month]);

    if (result.rows.length === 0) {
      return; // Keine Daten für diesen Monat
    }

    const row = result.rows[0];

    const upsertQuery = `
      INSERT INTO ticket_stats_monthly (year, month, total_tickets, open_tickets, created_tickets, closed_tickets, aggregated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (year, month)
      DO UPDATE SET
        total_tickets = EXCLUDED.total_tickets,
        open_tickets = EXCLUDED.open_tickets,
        created_tickets = EXCLUDED.created_tickets,
        closed_tickets = EXCLUDED.closed_tickets,
        aggregated_at = NOW()
    `;
    await pool.query(upsertQuery, [
      year,
      month,
      row.total_tickets,
      row.open_tickets,
      row.created_this_month,
      row.closed_this_month
    ]);
  }

  /**
   * Gibt die letzten N Monate chronologisch sortiert zurück
   */
  static async getMonthlyTrend(months: number = 12): Promise<TicketStatsMonthly[]> {
    const query = `
      SELECT * FROM ticket_stats_monthly
      ORDER BY year DESC, month DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [months]);
    // Chronologisch sortieren (älteste zuerst)
    return result.rows.reverse();
  }

  /**
   * Gibt alle verfügbaren Monate aus den Snapshots zurück
   */
  static async getAvailableSnapshotMonths(): Promise<{ year: number; month: number }[]> {
    const query = `
      SELECT DISTINCT
        EXTRACT(YEAR FROM snapshot_time)::INTEGER AS year,
        EXTRACT(MONTH FROM snapshot_time)::INTEGER AS month
      FROM ticket_stats_snapshots
      ORDER BY year ASC, month ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}
