import pool from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: Date;
}

export class UserModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
  }

  static async create(email: string, password: string, role: 'admin' | 'user' | 'viewer' = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at';
    const result = await pool.query(query, [email, hashedPassword, role]);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT id, email, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async findAll(): Promise<User[]> {
    const query = 'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id: number, updates: { email?: string; password?: string; role?: 'admin' | 'user' | 'viewer' }) {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateFields.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updates.role) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (updateFields.length === 0) {
      throw new Error('Keine Updates angegeben');
    }

    values.push(id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, role, created_at`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async seedDefaultUsers() {
    try {
      // Prüfe ob bereits User existieren
      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(countResult.rows[0].count) > 0) {
        return;
      }

      // Erstelle Standard-User mit allen Rollen
      await this.create('admin@monitoring.local', 'admin123', 'admin');
      await this.create('user@monitoring.local', 'user123', 'user');
      await this.create('viewer@monitoring.local', 'viewer123', 'viewer');
      console.log('✓ Standard-User erstellt (admin, user, viewer)');
    } catch (error) {
      console.error('Fehler beim Erstellen der Standard-User:', error);
    }
  }
}
