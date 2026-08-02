-- Migration to add metrics columns for Incubation Applications (saves, follows, views)

ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS followers_count NUMERIC DEFAULT 0;
ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS saves_count NUMERIC DEFAULT 0;
ALTER TABLE public.incubation_applications ADD COLUMN IF NOT EXISTS profile_views NUMERIC DEFAULT 0;
