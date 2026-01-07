import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// CRITICAL: Load .env BEFORE accessing process.env.DATABASE_URL
// This module is imported before index.ts runs dotenv.config()
const envPaths = [
  path.join(process.cwd(), 'backend', '.env'),  // PM2 from root: ~/pon2
  path.join(process.cwd(), '.env'),              // Direct run from backend/
  path.join(__dirname, '..', '..', '.env'),      // From dist/ folder
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  db/index.ts: No .env file found! Using environment variables from PM2/shell');
}

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Searched .env paths:', envPaths);
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse and properly encode the connection string to handle special characters in password
// This fixes issues with characters like !, @, #, etc. in passwords
function sanitizeConnectionString(url: string): string {
  try {
    const parsed = new URL(url);

    // URL constructor automatically encodes the password, but we need to ensure it's correct
    // Reconstruct the URL with properly encoded components
    const username = parsed.username;
    const password = parsed.password; // Already decoded by URL constructor
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const database = parsed.pathname.slice(1); // Remove leading /

    // Manually encode password to ensure special characters are handled
    const encodedPassword = encodeURIComponent(password);

    // Reconstruct the connection string
    const sanitized = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;

    console.log('🔧 Database connection:');
    console.log(`   User: ${username}`);
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Database: ${database}`);
    console.log(`   Password: ${'*'.repeat(password.length)} (${password.length} chars)`);

    return sanitized;
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error);
    console.error('   Using raw connection string (may fail with special characters)');
    return url;
  }
}

const connectionString = sanitizeConnectionString(rawConnectionString);

// Disable prefetch as it is not supported for "Transaction" pool mode
// Enable SSL for AlwaysData PostgreSQL (required for remote connections)
// Add robust timeout and keep-alive configuration for production
export const client = postgres(connectionString, {
  prepare: false,

  // SSL Configuration
  ssl: { rejectUnauthorized: false },  // AlwaysData SSL with self-signed cert

  // Connection Timeouts (in seconds)
  connect_timeout: 10,           // 10 seconds to establish connection
  idle_timeout: 30,              // Close idle connections after 30 seconds
  max_lifetime: 60 * 30,         // Max connection lifetime: 30 minutes

  // TCP Keep-Alive (prevents connection drops)
  keepalives: 1,                 // Enable TCP keep-alive
  keepalives_idle: 10,           // Wait 10 seconds before first keep-alive

  // Connection Pool
  max: 10,                       // Max 10 concurrent connections

  // PostgreSQL Session Settings
  options: {
    statement_timeout: 30000,                        // 30 seconds per statement
    idle_in_transaction_session_timeout: 60000,      // 60 seconds for idle transactions
  },

  // Debug mode (remove in production if too verbose)
  debug: process.env.NODE_ENV === 'development',

  // Error handling
  onnotice: () => {},            // Suppress notices
  onparameter: () => {},         // Suppress parameter changes
});

console.log('✅ PostgreSQL client configured with SSL, timeouts, and keep-alive');

export const db = drizzle(client, { schema });

// Helper function to generate CUID IDs (compatible with Prisma's cuid)
export const generateId = createId;

// Export all schema tables and relations
export * from './schema';
