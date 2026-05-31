import app from './app.js';
import config from './config/env.js';
import pool from './db/pool.js';

async function start() {
  try {
    // Fail fast if the database is unreachable.
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('Could not connect to MySQL. Check that it is running and that .env is correct.');
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`FitSync API listening on http://localhost:${config.port} (${config.env})`);
  });
}

start();
