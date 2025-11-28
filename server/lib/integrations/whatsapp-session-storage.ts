
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

interface SessionData {
  session: string;
}

export class DatabaseSessionStorage {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  async saveSession(sessionData: string): Promise<void> {
    await db.execute(sql`
      INSERT INTO whatsapp_sessions (user_id, session_data, created_at, updated_at)
      VALUES (${this.userId}, ${sessionData}, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET session_data = ${sessionData}, updated_at = NOW()
    `);
  }

  async getSession(): Promise<string | null> {
    const result = await db.execute(sql`
      SELECT session_data FROM whatsapp_sessions 
      WHERE user_id = ${this.userId}
    `);
    
    return result.rows[0]?.session_data || null;
  }

  async deleteSession(): Promise<void> {
    await db.execute(sql`
      DELETE FROM whatsapp_sessions WHERE user_id = ${this.userId}
    `);
  }
}
