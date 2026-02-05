
import { db } from './server/db.js';

async function main() {
  console.log('DB imported successfully in root:', !!db);
  process.exit(0);
}

main().catch(console.error);
