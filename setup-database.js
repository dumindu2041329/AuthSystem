require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL queries one by one
    const statements = sql
      .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .split(';') // Split on semicolons
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0); // Remove empty statements
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('pgexec', { cmd: statement });
      
      if (error) {
        console.error('Error executing SQL:', error);
      }
    }
    
    console.log('Database setup complete!');
    
    // Test if tables exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      console.error('Error checking users table:', usersError);
    } else {
      console.log('Users table exists and is accessible');
    }
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('sid')
      .limit(1);
      
    if (sessionsError) {
      console.error('Error checking sessions table:', sessionsError);
    } else {
      console.log('Sessions table exists and is accessible');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();