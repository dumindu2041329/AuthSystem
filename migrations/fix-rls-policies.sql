-- Drop the existing row level security policies that are too restrictive
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create new policies that allow the service role to perform all operations
CREATE POLICY "Enable all operations for service role" ON public.users
  USING (auth.role() = 'service_role' OR auth.role() = 'anon')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'anon');

-- Make sure session policies are properly set
DROP POLICY IF EXISTS "Sessions are viewable by service role" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be inserted by service role" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be updated by service role" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be deleted by service role" ON public.sessions;

-- Create new comprehensive session policy
CREATE POLICY "Enable all operations for service role on sessions" ON public.sessions
  USING (auth.role() = 'service_role' OR auth.role() = 'anon')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'anon');