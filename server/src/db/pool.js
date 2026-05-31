import mysql from 'mysql2/promise';
import config from '../config/env.js';

/**
 * A shared MySQL connection pool used across the whole app.
 * Using a pool avoids opening a new connection per request.
 */
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

/**
 * Small helper around pool.query that returns just the rows.
 * @param {string} sql
 * @param {object|Array} [params]
 */
export async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export default pool;
