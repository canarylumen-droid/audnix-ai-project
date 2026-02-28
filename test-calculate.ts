import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function calculateAverageResponseTime(userId: string): Promise<string> {
    const result: any = await db.execute(sql`
      WITH response_times AS (
        SELECT 
          m2.created_at - m1.created_at as duration
        FROM messages m1
        JOIN messages m2 ON m1.lead_id = m2.lead_id
        WHERE m1.direction = 'outbound'
          AND m2.direction = 'inbound'
          AND m2.created_at > m1.created_at
          AND m1.user_id = ${userId}
          AND NOT EXISTS (
            SELECT 1 FROM messages m3
            WHERE m3.lead_id = m1.lead_id
              AND m3.created_at > m1.created_at
              AND m3.created_at < m2.created_at
          )
      )
      SELECT 
        AVG(EXTRACT(EPOCH FROM duration)) as avg_seconds
      FROM response_times
    `);

    const row = Array.isArray(result) ? result[0] : result?.rows?.[0];
    const avgSeconds = Number(row?.avg_seconds || 0);
    if (avgSeconds <= 0) return '—';
    
    if (avgSeconds < 3600) {
      return `${Math.round(avgSeconds / 60)}m`;
    } else if (avgSeconds < 86400) {
      return `${(avgSeconds / 3600).toFixed(1)}h`;
    } else {
      return `${(avgSeconds / 86400).toFixed(1)}d`;
    }
  }

calculateAverageResponseTime('test').then(console.log).catch(console.error);
