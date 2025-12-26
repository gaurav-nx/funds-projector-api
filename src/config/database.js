import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load .env file for local development
if (process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  dotenv.config();
}

let cachedPool = null;

/**
 * Connect to PostgreSQL with connection reuse for Lambda
 * Lambda containers are reused, so we cache the connection pool
 * Database credentials are fetched from AWS Secrets Manager
 */
async function connectDB() {
  // Return cached pool if available
  if (cachedPool) {
    return cachedPool;
  }

  try {
    let dbConfig;

    // In local development, use environment variables
    // In Lambda (production), fetch from AWS Secrets Manager
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Local development - use environment variables
      dbConfig = {
        host: process.env.DB_HOST || process.env.POSTGRES_HOST,
        port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'),
        database: process.env.DB_NAME || process.env.POSTGRES_DB || 'postgres',
        user: process.env.DB_USER || process.env.POSTGRES_USER,
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
      };
    } else {
      // Production - fetch from AWS Secrets Manager
      const { getDbConfig } = await import('../utils/aws-secrets.js');
      const secretName = process.env.DB_SECRET_NAME || 'funds-project/postgres';
      dbConfig = await getDbConfig(secretName);
    }

    // Validate required fields
    if (!dbConfig.host || !dbConfig.user || !dbConfig.password) {
      throw new Error('Database configuration incomplete. Check environment variables or AWS Secrets Manager.');
    }

    // Connection pool options optimized for Lambda
    const poolConfig = {
      host: dbConfig.host,
      port: dbConfig.port || 5432,
      database: dbConfig.database || 'postgres',
      user: dbConfig.user,
      password: dbConfig.password,
      // Lambda-optimized settings
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
      // SSL configuration for RDS (enabled by default for AWS RDS)
      // RDS typically requires SSL for external connections
      ssl: process.env.DB_SSL === 'false' || process.env.DB_SSL === '0' 
        ? false 
        : { rejectUnauthorized: false },
    };

    // Create connection pool
    const pool = new Pool(poolConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Cache the pool
    cachedPool = pool;

    console.log('PostgreSQL connected successfully');

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      cachedPool = null; // Reset cache on error
    });

    return pool;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    cachedPool = null; // Reset cache on failure
    throw error;
  }
}

/**
 * Get a client from the pool for queries
 */
async function getClient() {
  const pool = await connectDB();
  return pool.connect();
}

/**
 * Execute a query (helper function)
 */
async function query(text, params) {
  const pool = await connectDB();
  return pool.query(text, params);
}

export default connectDB;
export { getClient, query };
