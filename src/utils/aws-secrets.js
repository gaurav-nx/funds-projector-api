/**
 * Utility to fetch secrets from AWS Secrets Manager
 * Used for storing database connection credentials securely
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedSecret = null;

/**
 * Get secret from AWS Secrets Manager
 * @param {string} secretName - Name or ARN of the secret in Secrets Manager
 * @returns {Promise<Object|String>} Secret value (parsed JSON or string)
 */
export async function getSecret(secretName) {
  // Return cached secret if available (for Lambda reuse)
  if (cachedSecret) {
    return cachedSecret;
  }

  try {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1'
    });

    const command = new GetSecretValueCommand({
      SecretId: secretName
    });

    const response = await client.send(command);
    
    // Parse JSON secret if it's a string, otherwise return as string
    let secret;
    if (response.SecretString) {
      try {
        secret = JSON.parse(response.SecretString);
      } catch (e) {
        // If not JSON, return as plain string
        secret = response.SecretString;
      }
    } else if (response.SecretBinary) {
      secret = Buffer.from(response.SecretBinary, 'base64').toString('utf-8');
    } else {
      throw new Error('Secret value is empty');
    }

    cachedSecret = secret;
    return secret;
  } catch (error) {
    console.error('Error fetching secret from AWS Secrets Manager:', error);
    throw error;
  }
}

/**
 * Get PostgreSQL database configuration from Secrets Manager
 * Supports multiple formats:
 * - JSON with individual fields: {"host":"...","port":5432,"user":"...","password":"...","database":"..."}
 * - JSON with connection string: {"connectionString":"postgresql://..."}
 * - RDS format: {"username":"...","password":"..."} (with endpoint from env)
 * @param {string} secretName - Secret name or ARN (default: 'funds-project/postgres')
 * @returns {Promise<Object>} Database configuration object
 */
export async function getDbConfig(secretName = 'funds-project/postgres') {
  const secret = await getSecret(secretName);
  
  // If secret is an object
  if (typeof secret === 'object') {
    // Format 1: Full config object
    if (secret.host || secret.endpoint) {
      return {
        host: secret.host || secret.endpoint || secret.db_endpoint,
        port: secret.port || 5432,
        database: secret.database || secret.dbname || secret.db_name || 'postgres',
        user: secret.user || secret.username || secret.db_username,
        password: secret.password || secret.db_password,
        ssl: secret.ssl || false
      };
    }
    
    // Format 2: Connection string
    if (secret.connectionString || secret.connection_string) {
      const connString = secret.connectionString || secret.connection_string;
      return parseConnectionString(connString);
    }
    
    // Format 3: RDS format (username/password only, endpoint from env)
    if (secret.username || secret.db_username) {
      return {
        host: process.env.DB_ENDPOINT || process.env.RDS_ENDPOINT || secret.endpoint,
        port: parseInt(process.env.DB_PORT || secret.port || '5432'),
        database: process.env.DB_NAME || secret.database || secret.dbname || 'postgres',
        user: secret.username || secret.db_username,
        password: secret.password || secret.db_password,
      };
    }
  }
  
  // If secret is a connection string
  if (typeof secret === 'string' && secret.startsWith('postgresql://')) {
    return parseConnectionString(secret);
  }
  
  throw new Error('Unable to parse database configuration from secret');
}

/**
 * Parse PostgreSQL connection string
 * @param {string} connectionString - PostgreSQL connection string
 * @returns {Object} Database configuration object
 */
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1) || 'postgres',
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('ssl') === 'true'
    };
  } catch (error) {
    throw new Error(`Invalid connection string format: ${error.message}`);
  }
}
