import app from './app.js';
import config from './config/env.js';
import pool from './db/pool.js';

async function start() {
  try {
    // Fail fast if the database is unreachable.
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✓ Connected to MySQL');
  } catch (err) {
    console.error('✗ Could not connect to MySQL. Is it running and is .env correct?');
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`\n🏋️  FitSync API running at http://localhost:${config.port}`);
    console.log(`   Environment: ${config.env}`);
    console.log(`   Health check: http://localhost:${config.port}/api/health\n`);
  });
}

start();
