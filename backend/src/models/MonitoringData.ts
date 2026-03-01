import pool from '../config/database';

export interface MonitoringEntry {
  id: number;
  service_type: 'starlink' | 'ticketsystem' | 'firewall' | 'website';
  service_name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  response_time?: number;
  last_check: Date;
  details?: any;
}

export class MonitoringDataModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS monitoring_data (
        id SERIAL PRIMARY KEY,
        service_type VARCHAR(50) NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        response_time INTEGER,
        last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_service_type ON monitoring_data(service_type);
      CREATE INDEX IF NOT EXISTS idx_status ON monitoring_data(status);
      CREATE INDEX IF NOT EXISTS idx_last_check ON monitoring_data(last_check);
    `;
    await pool.query(query);
  }

  static async upsert(data: Omit<MonitoringEntry, 'id' | 'last_check'>) {
    const query = `
      INSERT INTO monitoring_data (service_type, service_name, status, response_time, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.service_type,
      data.service_name,
      data.status,
      data.response_time,
      JSON.stringify(data.details || {})
    ]);
    return result.rows[0];
  }

  static async getLatestByType(serviceType: string): Promise<MonitoringEntry[]> {
    const query = `
      SELECT DISTINCT ON (service_name) *
      FROM monitoring_data
      WHERE service_type = $1
      ORDER BY service_name, last_check DESC;
    `;
    const result = await pool.query(query, [serviceType]);
    return result.rows;
  }

  static async getDashboardSummary() {
    const query = `
      WITH latest_entries AS (
        SELECT DISTINCT ON (service_type, service_name) *
        FROM monitoring_data
        ORDER BY service_type, service_name, last_check DESC
      )
      SELECT
        service_type,
        COUNT(*) as total_services,
        COUNT(*) FILTER (WHERE status = 'online') as online,
        COUNT(*) FILTER (WHERE status = 'offline') as offline,
        COUNT(*) FILTER (WHERE status = 'warning') as warning,
        COUNT(*) FILTER (WHERE status = 'error') as error,
        AVG(response_time) as avg_response_time
      FROM latest_entries
      GROUP BY service_type;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async seedDemoData() {
    try {
      // Starlink
      await this.upsert({
        service_type: 'starlink',
        service_name: 'Starlink Hauptstandort',
        status: 'online',
        response_time: 35,
        details: { satellites: 12, signal_strength: 95 }
      });

      // Ticketsystem
      await this.upsert({
        service_type: 'ticketsystem',
        service_name: 'Support Portal',
        status: 'online',
        response_time: 120,
        details: { open_tickets: 5, pending_tickets: 2 }
      });

      // Firewalls
      await this.upsert({
        service_type: 'firewall',
        service_name: 'DMZ Firewall',
        status: 'online',
        response_time: 5,
        details: { blocked_attempts: 142, cpu_usage: 23 }
      });

      await this.upsert({
        service_type: 'firewall',
        service_name: 'Internal Firewall',
        status: 'online',
        response_time: 3,
        details: { blocked_attempts: 89, cpu_usage: 18 }
      });

      // Websites
      await this.upsert({
        service_type: 'website',
        service_name: 'Hauptwebsite',
        status: 'online',
        response_time: 250,
        details: { ssl_valid: true, uptime: '99.9%' }
      });

      await this.upsert({
        service_type: 'website',
        service_name: 'API Server',
        status: 'online',
        response_time: 85,
        details: { ssl_valid: true, uptime: '99.95%' }
      });

      console.log('✓ Demo-Monitoring-Daten erstellt');
    } catch (error) {
      console.error('Fehler beim Erstellen der Demo-Daten:', error);
    }
  }
}
