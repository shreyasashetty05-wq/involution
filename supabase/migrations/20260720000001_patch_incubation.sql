-- 1. Ensure ask_amount, founder_photo_url, and team_members columns exist
-- This safely adds the columns if they were missed during the SQL execution earlier.
ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS ask_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS founder_photo_url TEXT DEFAULT '';
ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb;

-- 2. Drop the broken RLS policy
DROP POLICY IF EXISTS "Users can manage their own incubation apps" ON public.incubation_applications;

-- 3. Create the correct RLS policy that doesn't query auth.users
CREATE POLICY "Users can manage their own incubation apps"
    ON public.incubation_applications
    FOR ALL
    USING (owner_email = (auth.jwt() ->> 'email'))
    WITH CHECK (owner_email = (auth.jwt() ->> 'email'));
