import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Running migrations…');
  await migrate(db, {
    migrationsFolder: resolve(__dirname, '../../drizzle'),
  });
  console.log('Migrations complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
