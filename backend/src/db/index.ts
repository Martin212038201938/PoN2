import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// CRITICAL: Manually load and FORCE-OVERRIDE environment variables from .env
// This bypasses dotenv's quirks with PM2/shell pre-set variables
const envPaths = [
  path.join(process.cwd(), 'backend', '.env'),  // PM2 from root: ~/pon2
  path.join(process.cwd(), '.env'),              // Direct run from backend/
  path.join(__dirname, '..', '..', '.env'),      // From dist/ folder
  path.join(__dirname, '..', '.env'),            // From src/ folder
];

function loadEnvFileManually(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // FORCE override - this is the key difference from dotenv
      process.env[key] = value;
    }
    return true;
  } catch {
    return false;
  }
}

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    if (loadEnvFileManually(envPath)) {
      console.log(`✅ Loaded .env from: ${envPath} (manual override)`);
      console.log(`   PORT is now: ${process.env.PORT}`);
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
