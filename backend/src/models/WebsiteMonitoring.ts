import pool from '../config/database';

export interface Website {
  id?: number;
  url: string;
  name: string;
  enabled: boolean;
  check_interval: number; // in Sekunden
  created_at?: Date;
  updated_at?: Date;
}

export interface WebsiteCheck {
  id?: number;
  website_id: number;
  status: 'online' | 'offline';
  response_time: number; // in ms
  status_code?: number;
  error_message?: string;
  checked_at?: Date;
}

export class WebsiteMonitoringModel {
  static async createTables() {
    const query = `
      -- Websites Tabelle
      CREATE TABLE IF NOT EXISTS websites (
        id SERIAL PRIMARY KEY,
        url VARCHAR(500) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        check_interval INTEGER DEFAULT 300,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Website Checks Tabelle (24h Historie)
      CREATE TABLE IF NOT EXISTS website_checks (
        id SERIAL PRIMARY KEY,
        website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        response_time INTEGER NOT NULL,
        status_code INTEGER,
        error_message TEXT,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_website_checks_website_id ON website_checks(website_id);
      CREATE INDEX IF NOT EXISTS idx_website_checks_checked_at ON website_checks(checked_at DESC);
      CREATE INDEX IF NOT EXISTS idx_website_checks_website_time ON website_checks(website_id, checked_at DESC);
    `;
    await pool.query(query);
  }

  // Website Management
  static async addWebsite(website: Omit<Website, 'id' | 'created_at' | 'updated_at'>): Promise<Website> {
    const query = `
      INSERT INTO websites (url, name, enabled, check_interval)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      website.url,
      website.name,
      website.enabled,
      website.check_interval
    ]);
    return result.rows[0];
  }

  static async getAllWebsites(): Promise<Website[]> {
    const query = 'SELECT * FROM websites ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getEnabledWebsites(): Promise<Website[]> {
    const query = 'SELECT * FROM websites WHERE enabled = true ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getWebsiteById(id: number): Promise<Website | null> {
    const query = 'SELECT * FROM websites WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateWebsite(id: number, updates: Partial<Website>): Promise<Website | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE websites
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteWebsite(id: number): Promise<boolean> {
    const query = 'DELETE FROM websites WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  // Website Checks
  static async addCheck(check: Omit<WebsiteCheck, 'id' | 'checked_at'>): Promise<WebsiteCheck> {
    const query = `
      INSERT INTO website_checks (website_id, status, response_time, status_code, error_message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      check.website_id,
      check.status,
      check.response_time,
      check.status_code,
      check.error_message
    ]);
    return result.rows[0];
  }

  static async getChecksLast24Hours(websiteId: number): Promise<WebsiteCheck[]> {
    const query = `
      SELECT *
      FROM website_checks
      WHERE website_id = $1
        AND checked_at >= NOW() - INTERVAL '24 hours'
      ORDER BY checked_at DESC;
    `;
    const result = await pool.query(query, [websiteId]);
    return result.rows;
  }

  static async getLatestCheck(websiteId: number): Promise<WebsiteCheck | null> {
    const query = `
      SELECT *
      FROM website_checks
      WHERE website_id = $1
      ORDER BY checked_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [websiteId]);
    return result.rows[0] || null;
  }

  static async getStats24Hours(websiteId: number) {
    const query = `
      SELECT
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE status = 'online') as successful_checks,
        COUNT(*) FILTER (WHERE status = 'offline') as failed_checks,
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        (COUNT(*) FILTER (WHERE status = 'online')::float / COUNT(*)::float * 100) as uptime_percentage
      FROM website_checks
      WHERE website_id = $1
        AND checked_at >= NOW() - INTERVAL '24 hours';
    `;
    const result = await pool.query(query, [websiteId]);
    return result.rows[0];
  }

  static async deleteOldChecks(olderThanHours: number = 24) {
    const query = `
      DELETE FROM website_checks
      WHERE checked_at < NOW() - INTERVAL '${olderThanHours} hours';
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }

  // Seed Demo Websites
  static async seedDemoWebsites() {
    try {
      const websites = [
        { url: 'https://google.com', name: 'Google', enabled: true, check_interval: 300 },
        { url: 'https://github.com', name: 'GitHub', enabled: true, check_interval: 300 },
        { url: 'https://stackoverflow.com', name: 'Stack Overflow', enabled: true, check_interval: 300 },
      ];

      for (const website of websites) {
        try {
          await this.addWebsite(website);
        } catch (error: any) {
          // Ignoriere Duplikate
          if (!error.message.includes('duplicate key')) {
            console.error(`Fehler beim Hinzufügen von ${website.name}:`, error);
          }
        }
      }

      console.log('✓ Demo-Websites erstellt');
    } catch (error) {
      console.error('Fehler beim Erstellen der Demo-Websites:', error);
    }
  }
}
