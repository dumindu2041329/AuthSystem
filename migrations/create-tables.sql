-- First, create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create the sessions table for authentication storage
CREATE TABLE IF NOT EXISTS public.sessions (
  sid VARCHAR(255) PRIMARY KEY NOT NULL,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- Create index for session expiration lookups
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions(expire);

-- Ensure tables are secured but accessible to the service role
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
-- For users table
CREATE POLICY "Users are viewable by authenticated users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- For sessions table
CREATE POLICY "Sessions are viewable by service role" ON public.sessions
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Sessions can be inserted by service role" ON public.sessions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Sessions can be updated by service role" ON public.sessions
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Sessions can be deleted by service role" ON public.sessions
  FOR DELETE USING (auth.role() = 'service_role');