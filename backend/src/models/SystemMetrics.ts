import pool from '../config/database';

export interface SystemMetricsEntry {
  id: number;
  cpu_usage: number;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  created_at: Date;
}

export class SystemMetricsModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        cpu_usage DECIMAL(5,2) NOT NULL,
        memory_total BIGINT NOT NULL,
        memory_used BIGINT NOT NULL,
        memory_free BIGINT NOT NULL,
        disk_total BIGINT NOT NULL,
        disk_used BIGINT NOT NULL,
        disk_free BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at DESC);
    `;
    await pool.query(query);
  }

  static async saveMetrics(metrics: {
    cpu_usage: number;
    memory_total: number;
    memory_used: number;
    memory_free: number;
    disk_total: number;
    disk_used: number;
    disk_free: number;
  }): Promise<void> {
    const query = `
      INSERT INTO system_metrics (
        cpu_usage, memory_total, memory_used, memory_free,
        disk_total, disk_used, disk_free
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await pool.query(query, [
      metrics.cpu_usage,
      metrics.memory_total,
      metrics.memory_used,
      metrics.memory_free,
      metrics.disk_total,
      metrics.disk_used,
      metrics.disk_free
    ]);
  }

  static async getMetricsHistory(hours: number = 24): Promise<SystemMetricsEntry[]> {
    const query = `
      SELECT
        id, cpu_usage, memory_total, memory_used, memory_free,
        disk_total, disk_used, disk_free, created_at
      FROM system_metrics
      WHERE created_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async cleanupOldMetrics(hoursToKeep: number = 168): Promise<void> {
    // 168 Stunden = 7 Tage
    const query = `
      DELETE FROM system_metrics
      WHERE created_at < NOW() - INTERVAL '${hoursToKeep} hours'
    `;
    await pool.query(query);
  }
}
