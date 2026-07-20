-- Add new columns for the comprehensive incubation application form
ALTER TABLE public.incubation_applications 
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS github_url TEXT,
    
    ADD COLUMN IF NOT EXISTS education_type TEXT DEFAULT 'College Degree',
    ADD COLUMN IF NOT EXISTS course TEXT,
    ADD COLUMN IF NOT EXISTS branch TEXT,
    ADD COLUMN IF NOT EXISTS semester TEXT,
    ADD COLUMN IF NOT EXISTS graduation_year TEXT,
    ADD COLUMN IF NOT EXISTS school_class TEXT,
    ADD COLUMN IF NOT EXISTS school_board TEXT,
    ADD COLUMN IF NOT EXISTS diploma_course TEXT,
    ADD COLUMN IF NOT EXISTS diploma_branch TEXT,
    ADD COLUMN IF NOT EXISTS student_id_url TEXT,
    
    ADD COLUMN IF NOT EXISTS idea_logo_url TEXT,
    ADD COLUMN IF NOT EXISTS tagline TEXT,
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS innovation_usp TEXT,
    ADD COLUMN IF NOT EXISTS target_users TEXT,
    
    ADD COLUMN IF NOT EXISTS prototype_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS prototype_link TEXT,
    ADD COLUMN IF NOT EXISTS github_repo TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS technology_used JSONB DEFAULT '[]'::jsonb,
    
    ADD COLUMN IF NOT EXISTS test_users_count TEXT,
    ADD COLUMN IF NOT EXISTS pilot_testing TEXT,
    ADD COLUMN IF NOT EXISTS mentor_feedback TEXT,
    ADD COLUMN IF NOT EXISTS hackathon_participation TEXT,
    ADD COLUMN IF NOT EXISTS prototype_demo TEXT,
    ADD COLUMN IF NOT EXISTS other_validation TEXT,
    
    ADD COLUMN IF NOT EXISTS support_needed JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS funding_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS fund_utilization JSONB DEFAULT '[]'::jsonb,
    
    ADD COLUMN IF NOT EXISTS ai_match_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS innovation_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS incubation_readiness NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS feasibility_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
