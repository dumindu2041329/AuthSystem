-- First, create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMPTZ,
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