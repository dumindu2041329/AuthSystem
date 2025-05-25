import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase connection details from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or key is missing! Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Test Supabase connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or key is missing');
      return false;
    }
    
    // Try to get session - simplest operation that should work
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase test error:', error);
    return false;
  }
}

// List tables in Supabase
export async function listSupabaseTables() {
  try {
    // Try a simple check for the users table existence
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const { error: sessionsError } = await supabase
      .from('sessions')
      .select('sid')
      .limit(1);
    
    // Return table existence status
    return {
      tables: {
        users: {
          exists: !usersError || usersError.code !== '42P01', // 42P01 is "table does not exist"
          error: usersError
        },
        sessions: {
          exists: !sessionsError || sessionsError.code !== '42P01',
          error: sessionsError
        }
      }
    };
  } catch (error) {
    console.error('Error listing tables:', error);
    return {
      tables: {
        users: { exists: false, error },
        sessions: { exists: false, error }
      }
    };
  }
}