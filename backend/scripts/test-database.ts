#!/usr/bin/env tsx
/**
 * Test Database Connection
 *
 * This script tests the DATABASE_URL and shows connection details
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

// Load .env with same strategy as main app
const envPaths = [
  path.join(process.cwd(), 'backend', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env'),
];

console.log('🔍 Searching for .env file...\n');
let envLoaded = false;
for (const envPath of envPaths) {
  console.log(`   Checking: ${envPath}`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`   ✅ Found and loaded: ${envPath}\n`);
    envLoaded = true;
    break;
  } else {
    console.log(`   ❌ Not found`);
  }
}

if (!envLoaded) {
  console.error('\n❌ ERROR: No .env file found!');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set in .env file!');
  process.exit(1);
}

console.log('📋 DATABASE_URL Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Parse the DATABASE_URL
try {
  const url = new URL(DATABASE_URL);
  console.log(`   Protocol: ${url.protocol}`);
  console.log(`   Username: ${url.username}`);
  console.log(`   Password: ${url.password.replace(/./g, '*')}`);
  console.log(`   Host:     ${url.hostname}`);
  console.log(`   Port:     ${url.port || '5432'}`);
  console.log(`   Database: ${url.pathname.slice(1)}`);
  console.log('');
} catch (error: any) {
  console.error(`❌ ERROR: Invalid DATABASE_URL format!`);
  console.error(`   ${error.message}`);
  process.exit(1);
}

console.log('🔌 Testing database connection (node-postgres)...\n');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
  connectionTimeoutMillis: 10000,
});

try {
  // Test connection
  const result = await pool.query('SELECT version(), current_database(), current_user');

  console.log('✅ Connection successful!\n');
  console.log('📊 Database Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   PostgreSQL Version: ${result.rows[0].version?.split(' ')[0] || 'Unknown'}`);
  console.log(`   Database: ${result.rows[0].current_database}`);
  console.log(`   User: ${result.rows[0].current_user}`);
  console.log('');

  // Check if tables exist
  console.log('🔍 Checking for Drizzle tables...\n');
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  if (tables.rows.length === 0) {
    console.log('⚠️  No tables found! You need to run: npm run db:init');
  } else {
    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
  }
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Database connection test PASSED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error: any) {
  console.error('❌ Database connection FAILED!\n');
  console.error('Error details:');
  console.error(`   Code:    ${error.code || 'Unknown'}`);
  console.error(`   Message: ${error.message}`);
  console.error('');

  if (error.code === 'ECONNREFUSED') {
    console.error('💡 ECONNREFUSED means:');
    console.error('   1. PostgreSQL server is not running');
    console.error('   2. Wrong host or port');
    console.error('   3. Firewall blocking connection');
    console.error('');
    console.error('📋 To find the correct DATABASE_URL:');
    console.error('   1. Go to https://admin.alwaysdata.com');
    console.error('   2. Databases → PostgreSQL');
    console.error('   3. Check connection details for your database');
    console.error('');
  } else if (error.code === 'ENOTFOUND') {
    console.error('💡 ENOTFOUND means:');
    console.error('   - The hostname cannot be resolved');
    console.error('   - Check if host is correct in DATABASE_URL');
    console.error('');
  } else if (error.message?.includes('password')) {
    console.error('💡 Authentication failed:');
    console.error('   - Check username and password in DATABASE_URL');
    console.error('');
  }

  process.exit(1);
} finally {
  await pool.end();
}
