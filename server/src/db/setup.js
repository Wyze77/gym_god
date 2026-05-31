/**
 * Database setup / migration script.
 *
 *   node src/db/setup.js
 *
 * Steps:
 *   1. Connect to the MySQL server (no database selected).
 *   2. Create the FitSync database if it does not exist.
 *   3. Run schema.sql  (tables).
 *   4. Run seed.sql     (static exercise & badge reference data).
 *   5. Run seed.js      (demo user + sample workouts with recent dates).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import config from '../config/env.js';
import { seedDemoData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readSql(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

async function run() {
  console.log('Setting up the FitSync database...');

  // Connect without selecting a database so we can create it.
  const root = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await root.changeUser({ database: config.db.database });
  console.log(`Database "${config.db.database}" is ready`);

  await root.query(readSql('schema.sql'));
  console.log('Schema created');

  await root.query(readSql('seed.sql'));
  console.log('Reference data inserted (exercises, badges)');

  await root.end();

  // Dynamic demo data uses the shared pool and bcrypt hashing.
  await seedDemoData();
  console.log('Demo account and sample workouts inserted');

  console.log('Done. Start the server with: npm run dev');
  process.exit(0);
}

run().catch((err) => {
  console.error('Database setup failed:');
  console.error(err.message);
  process.exit(1);
});
