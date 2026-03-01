import pool from '../config/database';

export interface FirewallHistoryEntry {
  id?: number;
  firewall_ip: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  active_sessions: number;
  timestamp: Date;
  created_at?: Date;
}

export class FirewallHistoryModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS firewall_history (
        id SERIAL PRIMARY KEY,
        firewall_ip VARCHAR(15) NOT NULL,
        hostname VARCHAR(255) NOT NULL,
        cpu_usage INTEGER NOT NULL,
        memory_usage INTEGER NOT NULL,
        active_sessions INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_firewall_ip ON firewall_history(firewall_ip);
      CREATE INDEX IF NOT EXISTS idx_firewall_timestamp ON firewall_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_firewall_ip_timestamp ON firewall_history(firewall_ip, timestamp DESC);
    `;
    await pool.query(query);
  }

  static async insert(entry: Omit<FirewallHistoryEntry, 'id' | 'created_at'>) {
    const query = `
      INSERT INTO firewall_history (
        firewall_ip, hostname, cpu_usage, memory_usage, active_sessions, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      entry.firewall_ip,
      entry.hostname,
      entry.cpu_usage,
      entry.memory_usage,
      entry.active_sessions,
      entry.timestamp
    ]);

    return result.rows[0];
  }

  static async getHistoryForFirewall(
    firewallIp: string,
    hoursBack: number = 4
  ): Promise<FirewallHistoryEntry[]> {
    const query = `
      SELECT *
      FROM firewall_history
      WHERE firewall_ip = $1
        AND timestamp >= NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY timestamp ASC;
    `;

    const result = await pool.query(query, [firewallIp]);
    return result.rows;
  }

  static async getAllFirewallsHistory(hoursBack: number = 4): Promise<Map<string, FirewallHistoryEntry[]>> {
    const query = `
      SELECT *
      FROM firewall_history
      WHERE timestamp >= NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY firewall_ip, timestamp ASC;
    `;

    const result = await pool.query(query);
    const historyMap = new Map<string, FirewallHistoryEntry[]>();

    result.rows.forEach((row) => {
      if (!historyMap.has(row.firewall_ip)) {
        historyMap.set(row.firewall_ip, []);
      }
      historyMap.get(row.firewall_ip)!.push(row);
    });

    return historyMap;
  }

  static async deleteOldEntries(olderThanHours: number = 24) {
    const query = `
      DELETE FROM firewall_history
      WHERE timestamp < NOW() - INTERVAL '${olderThanHours} hours';
    `;

    const result = await pool.query(query);
    return result.rowCount;
  }
}
