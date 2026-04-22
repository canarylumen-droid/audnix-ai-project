import { db } from './server/db.js';
import { integrations } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { decryptToJSON } from './server/lib/crypto/encryption.js';

async function main() {
  try {
    const res = await db.select().from(integrations).where(eq(integrations.id, 'bd8a933f-fa28-4b05-b9e0-8a652b0a77d5'));
    if (res.length > 0) {
      const meta = decryptToJSON(res[0].encryptedMeta);
      console.log('Provider:', res[0].provider);
      console.log('IMAP Host:', meta?.imap_host);
      console.log('SMTP Host:', meta?.smtp_host);
      console.log('Email:', meta?.email);
    } else {
      console.log('Integration not found.');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
