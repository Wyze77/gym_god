// Creates the database if needed, applies schema.sql, and seeds reference + demo data.
// Safe to re-run: schema.sql drops and recreates all tables.
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
