-- Migration: Create Knowledge Hub Schema

-- 1. Create Tables
CREATE TABLE public.knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.knowledge_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'hidden' CHECK (visibility IN ('public', 'hidden', 'featured', 'draft')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.knowledge_watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.knowledge_videos(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE TABLE public.knowledge_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.knowledge_videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE TABLE public.knowledge_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.knowledge_videos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_attachments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Knowledge Categories: Anyone can read, only Admins can write
CREATE POLICY "Categories are readable by everyone"
ON public.knowledge_categories FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage categories"
ON public.knowledge_categories FOR ALL
USING (is_admin());

-- Knowledge Videos: Everyone can read public/featured, Admins can manage all
CREATE POLICY "Videos are readable by everyone if public or featured"
ON public.knowledge_videos FOR SELECT
USING (visibility IN ('public', 'featured') OR is_admin());

CREATE POLICY "Admins can manage videos"
ON public.knowledge_videos FOR ALL
USING (is_admin());

-- Knowledge Attachments: Inherit video read access
CREATE POLICY "Attachments readable if video is readable"
ON public.knowledge_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_videos 
    WHERE id = knowledge_attachments.video_id 
    AND (visibility IN ('public', 'featured') OR is_admin())
  )
);

CREATE POLICY "Admins can manage attachments"
ON public.knowledge_attachments FOR ALL
USING (is_admin());

-- Watch History: Users manage their own
CREATE POLICY "Users can manage their own watch history"
ON public.knowledge_watch_history FOR ALL
USING (auth.uid() = user_id);

-- Bookmarks: Users manage their own
CREATE POLICY "Users can manage their own bookmarks"
ON public.knowledge_bookmarks FOR ALL
USING (auth.uid() = user_id);

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge_hub', 'knowledge_hub', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Give public read access to knowledge_hub"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge_hub');

CREATE POLICY "Admins can insert objects to knowledge_hub"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge_hub' AND is_admin());

CREATE POLICY "Admins can update objects in knowledge_hub"
ON storage.objects FOR UPDATE
USING (bucket_id = 'knowledge_hub' AND is_admin());

CREATE POLICY "Admins can delete objects from knowledge_hub"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge_hub' AND is_admin());

-- 5. Helper Functions/Triggers
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_videos_updated_at
BEFORE UPDATE ON public.knowledge_videos
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trigger_update_knowledge_watch_history_updated_at
BEFORE UPDATE ON public.knowledge_watch_history
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Initial Categories Seed
INSERT INTO public.knowledge_categories (name) VALUES 
('Fundraising'),
('Pitch Decks'),
('Legal'),
('Finance'),
('Marketing'),
('Product Development'),
('Startup Growth'),
('Investment Basics'),
('Technology'),
('Incubation'),
('Government Schemes'),
('Success Stories'),
('AI & Innovation')
ON CONFLICT DO NOTHING;
