const { Pool } = require('pg');
const logger = require('./logger');

let pool = null;

function createPool() {
  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set, database features disabled');
    return null;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', err);
  });

  pool.on('connect', () => {
    logger.info('New database connection established');
  });

  logger.info('Database connection pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

async function query(text, params) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
}

async function getClient() {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database not configured');
  }
  return await pool.connect();
}

async function testConnection() {
  try {
    const pool = getPool();
    if (!pool) {
      return false;
    }
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection test successful', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

module.exports = {
  query,
  getClient,
  getPool,
  createPool,
  testConnection,
  closePool,
};
