import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';
import * as schema from './schema';

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
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
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Helper function to generate CUID IDs (compatible with Prisma's cuid)
export const generateId = createId;

// Export all schema tables and relations
export * from './schema';
