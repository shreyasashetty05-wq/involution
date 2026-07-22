-- Migration for Follow System and Profile Views

-- Create startup_follows table
CREATE TABLE IF NOT EXISTS public.startup_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_email TEXT NOT NULL,
    startup_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(investor_email, startup_id)
);

-- Enable RLS for startup_follows
ALTER TABLE public.startup_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for startup_follows" ON public.startup_follows FOR ALL USING (true);

-- Create startup_profile_views table
CREATE TABLE IF NOT EXISTS public.startup_profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id TEXT NOT NULL,
    startup_id TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for startup_profile_views
ALTER TABLE public.startup_profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for startup_profile_views" ON public.startup_profile_views FOR ALL USING (true);
