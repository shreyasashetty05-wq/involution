-- Drop the old overly-strict policies that might be blocking the email check
DROP POLICY IF EXISTS "Users can view if they are a mentor" ON public.mentor_emails;
DROP POLICY IF EXISTS "Admins can view all mentor emails" ON public.mentor_emails;

-- Create a simplified policy that allows any logged-in user to read the mentor list
-- This ensures the middleware can always successfully verify if a user is a mentor
CREATE POLICY "Authenticated users can view mentor emails"
    ON public.mentor_emails
    FOR SELECT
    USING (auth.role() = 'authenticated');
