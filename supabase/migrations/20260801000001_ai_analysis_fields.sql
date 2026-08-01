-- Add comprehensive AI analysis fields for the Startup and Incubation modules

-- Update Startups table
ALTER TABLE public.startups 
    ADD COLUMN IF NOT EXISTS ai_analysis_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_executive_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_strengths JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_weaknesses JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_business_risks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_investment_readiness TEXT,
    ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMPTZ;

-- Update Incubation Applications table
ALTER TABLE public.incubation_applications 
    ADD COLUMN IF NOT EXISTS ai_analysis_score NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_executive_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_strengths JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_weaknesses JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_business_risks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_investment_readiness TEXT,
    ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMPTZ;
