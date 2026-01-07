#!/usr/bin/env tsx
/**
 * Initialize Drizzle Schema in PostgreSQL
 *
 * This script reads the drizzle-schema.sql file and executes it
 * directly via postgres.js, bypassing the need for psql CLI.
 *
 * Usage:
 *   npm run db:init
 *   tsx scripts/init-schema.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in environment variables');
  console.error('   Make sure .env file exists with DATABASE_URL');
  process.exit(1);
}

async function initSchema() {
  console.log('🚀 Initializing Drizzle Schema (node-postgres)...');
  console.log('');

  // Create postgres pool
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
  });

  try {
    // Read the schema SQL file
    const schemaPath = join(__dirname, '..', 'drizzle-schema.sql');
    console.log(`📁 Reading schema file: ${schemaPath}`);

    const schemaSql = readFileSync(schemaPath, 'utf-8');
    console.log(`✅ Schema file loaded (${schemaSql.length} bytes)`);
    console.log('');

    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    console.log('');

    // Execute the schema SQL
    console.log('🗄️  Applying schema to PostgreSQL...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Execute the entire SQL file
    await pool.query(schemaSql);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Schema applied successfully!');
    console.log('');

    // Verify tables were created
    console.log('📊 Verifying created tables...');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found! Schema may not have been applied.');
    } else {
      console.log(`✅ Found ${tables.rows.length} tables:`);
      tables.rows.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    }
    console.log('');

    // Verify enums were created
    console.log('📋 Verifying created ENUMs...');
    const enums = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname
    `);

    if (enums.rows.length === 0) {
      console.log('⚠️  No ENUMs found!');
    } else {
      console.log(`✅ Found ${enums.rows.length} ENUMs:`);
      enums.rows.forEach((enumType: any) => {
        console.log(`   - ${enumType.typname}`);
      });
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Drizzle Schema Initialization Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📍 Next steps:');
    console.log('   1. Start the backend: npm run start:prod');
    console.log('   2. Test the API: curl https://api.pon2.yellow-plane.com/api/health');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('❌ ERROR: Failed to initialize schema');
    console.error('');
    console.error('Error details:');
    console.error(error.message);

    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }

    if (error.position) {
      console.error(`Position: ${error.position}`);
    }

    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify DATABASE_URL is correct in .env');
    console.error('   2. Check database permissions');
    console.error('   3. Ensure PostgreSQL is accessible');
    console.error('');

    process.exit(1);
  } finally {
    // Close connection
    await pool.end();
  }
}

// Run the migration
initSchema();
