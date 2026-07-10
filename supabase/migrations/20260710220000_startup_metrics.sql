-- Add tracking metrics to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS profile_views NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count NUMERIC DEFAULT 0;
