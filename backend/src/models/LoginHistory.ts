import pool from '../config/database';

export interface LoginHistoryEntry {
  id: number;
  user_id: number;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: Date;
}

export class LoginHistoryModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
    `;
    await pool.query(query);
  }

  static async logLogin(
    userId: number,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean = true
  ): Promise<void> {
    const query = `
      INSERT INTO login_history (user_id, email, ip_address, user_agent, success)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [userId, email, ipAddress, userAgent, success]);
  }

  static async getRecentLogins(limit: number = 10): Promise<LoginHistoryEntry[]> {
    const query = `
      SELECT
        lh.id,
        lh.user_id,
        lh.email,
        lh.ip_address,
        lh.user_agent,
        lh.success,
        lh.created_at
      FROM login_history lh
      ORDER BY lh.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async cleanupOldEntries(daysToKeep: number = 90): Promise<void> {
    const query = `
      DELETE FROM login_history
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;
    await pool.query(query);
  }
}
