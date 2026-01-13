import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// CRITICAL: Load .env BEFORE accessing process.env.DATABASE_URL
// This module is imported before index.ts, so this is where .env gets loaded
// Using override:true ensures .env values take precedence over shell/PM2 environment
const envPaths = [
  path.join(process.cwd(), 'backend', '.env'),  // PM2 from root: ~/pon2
  path.join(process.cwd(), '.env'),              // Direct run from backend/
  path.join(__dirname, '..', '..', '.env'),      // From dist/ folder
  path.join(__dirname, '..', '.env'),            // From src/ folder
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    // override:true ensures .env file values OVERRIDE any existing env vars (from PM2, shell, etc.)
    const result = dotenv.config({ path: envPath, override: true });
    if (!result.error) {
      console.log(`✅ Loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded) {
  console.warn('⚠️  db/index.ts: No .env file found!');
  console.warn('   Searched paths:', envPaths);
  console.warn('   Using environment variables from PM2/shell');
}

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Searched .env paths:', envPaths);
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse connection string to show connection details
function logConnectionDetails(url: string): void {
  try {
    const parsed = new URL(url);
    console.log('🔧 Database connection (node-postgres):');
    console.log(`   User: ${parsed.username}`);
    console.log(`   Host: ${parsed.hostname}:${parsed.port || '5432'}`);
    console.log(`   Database: ${parsed.pathname.slice(1)}`);
    console.log(`   Password: ${'*'.repeat(parsed.password.length)} (${parsed.password.length} chars)`);
  } catch (error) {
    console.error('⚠️  Could not parse DATABASE_URL for logging');
  }
}

logConnectionDetails(rawConnectionString);

// Create PostgreSQL connection pool with node-postgres (pg)
// This is more stable on shared hosting than postgres.js
export const pool = new Pool({
  connectionString: rawConnectionString,

  // SSL configuration for AlwaysData
  ssl: {
    rejectUnauthorized: false,  // Accept self-signed certificates
  },

  // Connection pool settings
  max: 10,                      // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds if connection cannot be established

  // Application name for PostgreSQL logs
  application_name: 'pon2-backend',
});

console.log('✅ PostgreSQL connection pool created');

// Create Drizzle instance with node-postgres
export const db = drizzle(pool, { schema });

// Helper function to generate CUID IDs (compatible with Prisma's cuid)
export const generateId = createId;

// Export all schema tables and relations
export * from './schema';
