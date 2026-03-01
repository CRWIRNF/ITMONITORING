import pool from '../config/database';

export interface StarlinkHistoryEntry {
  id?: number;
  ship_id: string;
  ship_name: string;
  ship_full_name: string;
  period_start: Date;
  period_end: Date;
  total_standard_gb: number;
  total_priority_gb: number;
  total_opt_in_priority_gb: number;
  total_non_billable_gb: number;
  included_gb: number;
  status: string;
  kit_serial_number: string;
  dish_serial_number: string;
  terminal_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class StarlinkHistoryModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS starlink_history (
        id SERIAL PRIMARY KEY,
        ship_id VARCHAR(255) NOT NULL,
        ship_name VARCHAR(255) NOT NULL,
        ship_full_name VARCHAR(500) NOT NULL,
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        total_standard_gb DECIMAL(10, 2) DEFAULT 0,
        total_priority_gb DECIMAL(10, 2) DEFAULT 0,
        total_opt_in_priority_gb DECIMAL(10, 2) DEFAULT 0,
        total_non_billable_gb DECIMAL(10, 2) DEFAULT 0,
        included_gb INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        kit_serial_number VARCHAR(100),
        dish_serial_number VARCHAR(100),
        terminal_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ship_id, period_start)
      );

      CREATE INDEX IF NOT EXISTS idx_starlink_ship_id ON starlink_history(ship_id);
      CREATE INDEX IF NOT EXISTS idx_starlink_period ON starlink_history(period_start DESC);
      CREATE INDEX IF NOT EXISTS idx_starlink_ship_period ON starlink_history(ship_id, period_start DESC);
    `;
    await pool.query(query);
  }

  static async upsert(entry: Omit<StarlinkHistoryEntry, 'id' | 'created_at' | 'updated_at'>) {
    const query = `
      INSERT INTO starlink_history (
        ship_id, ship_name, ship_full_name, period_start, period_end,
        total_standard_gb, total_priority_gb, total_opt_in_priority_gb,
        total_non_billable_gb, included_gb, status,
        kit_serial_number, dish_serial_number, terminal_active,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      ON CONFLICT (ship_id, period_start)
      DO UPDATE SET
        ship_name = EXCLUDED.ship_name,
        ship_full_name = EXCLUDED.ship_full_name,
        period_end = EXCLUDED.period_end,
        total_standard_gb = EXCLUDED.total_standard_gb,
        total_priority_gb = EXCLUDED.total_priority_gb,
        total_opt_in_priority_gb = EXCLUDED.total_opt_in_priority_gb,
        total_non_billable_gb = EXCLUDED.total_non_billable_gb,
        included_gb = EXCLUDED.included_gb,
        status = EXCLUDED.status,
        kit_serial_number = EXCLUDED.kit_serial_number,
        dish_serial_number = EXCLUDED.dish_serial_number,
        terminal_active = EXCLUDED.terminal_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await pool.query(query, [
      entry.ship_id,
      entry.ship_name,
      entry.ship_full_name,
      entry.period_start,
      entry.period_end,
      entry.total_standard_gb,
      entry.total_priority_gb,
      entry.total_opt_in_priority_gb,
      entry.total_non_billable_gb,
      entry.included_gb,
      entry.status,
      entry.kit_serial_number,
      entry.dish_serial_number,
      entry.terminal_active
    ]);

    return result.rows[0];
  }

  static async getHistoryForShip(shipId: string, limit: number = 12): Promise<StarlinkHistoryEntry[]> {
    const query = `
      SELECT *
      FROM starlink_history
      WHERE ship_id = $1
      ORDER BY period_start DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [shipId, limit]);
    return result.rows;
  }

  static async getAllShipsLatestHistory(limit: number = 12): Promise<Map<string, StarlinkHistoryEntry[]>> {
    const query = `
      SELECT *
      FROM starlink_history
      WHERE period_start >= NOW() - INTERVAL '${limit} months'
      ORDER BY ship_id, period_start DESC;
    `;

    const result = await pool.query(query);
    const historyMap = new Map<string, StarlinkHistoryEntry[]>();

    result.rows.forEach((row) => {
      if (!historyMap.has(row.ship_id)) {
        historyMap.set(row.ship_id, []);
      }
      historyMap.get(row.ship_id)!.push(row);
    });

    return historyMap;
  }

  static async getOldestEntry(): Promise<Date | null> {
    const query = `
      SELECT MIN(period_start) as oldest
      FROM starlink_history;
    `;

    const result = await pool.query(query);
    return result.rows[0]?.oldest || null;
  }

  static async deleteOldEntries(olderThanMonths: number = 12) {
    const query = `
      DELETE FROM starlink_history
      WHERE period_start < NOW() - INTERVAL '${olderThanMonths} months';
    `;

    const result = await pool.query(query);
    return result.rowCount;
  }
}
