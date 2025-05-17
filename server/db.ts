import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Using Supabase database (need to be provided by user)
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database connections will fail.");
}

// Create PostgreSQL connection pool with SSL enabled for Supabase
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Required settings for Supabase connections
  ssl: {
    rejectUnauthorized: false
  },
  // Reasonable settings for a Supabase connection
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 5
});

// Test database connection function
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });