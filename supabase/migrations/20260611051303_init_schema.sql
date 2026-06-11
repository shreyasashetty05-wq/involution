-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Startups Table
CREATE TABLE public.startups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    sector TEXT NOT NULL,
    stage TEXT DEFAULT 'Seed',
    business_model TEXT DEFAULT 'B2B SaaS',
    requested NUMERIC NOT NULL,
    equity NUMERIC NOT NULL,
    risk TEXT DEFAULT 'Medium',
    score NUMERIC DEFAULT 80,
    revenue NUMERIC,
    burn NUMERIC,
    "desc" TEXT NOT NULL,
    videos JSONB DEFAULT '[]'::jsonb,
    financials JSONB DEFAULT '{}'::jsonb,
    financial_updates JSONB DEFAULT '[]'::jsonb,
    analysis TEXT DEFAULT '',
    is_student BOOLEAN DEFAULT false,
    founder_age NUMERIC,
    
    -- Extracted domains from Mongoose
    basic_info JSONB DEFAULT '{}'::jsonb,
    business_info JSONB DEFAULT '{}'::jsonb,
    financials_monthly JSONB DEFAULT '{}'::jsonb,
    financials_yearly JSONB DEFAULT '{}'::jsonb,
    investment_details JSONB DEFAULT '{}'::jsonb,
    growth_metrics JSONB DEFAULT '{}'::jsonb,
    operational_metrics JSONB DEFAULT '{}'::jsonb,
    credibility JSONB DEFAULT '{}'::jsonb,
    risk_disclosure JSONB DEFAULT '{}'::jsonb,
    ai_ready JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create KYCDocuments Table
CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Startup Founder',
    aadhaar TEXT NOT NULL,
    pan TEXT NOT NULL,
    aadhaar_file TEXT NOT NULL,
    pan_file TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    match_score NUMERIC DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Deals Table
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL, -- Keep as TEXT because original mongoose objectId strings were used
    startup_name TEXT NOT NULL,
    investor_id TEXT NOT NULL,
    status TEXT DEFAULT 'negotiating',
    term_amount TEXT DEFAULT '₹ 50,00,000',
    term_equity TEXT DEFAULT '10.0%',
    payment_method TEXT DEFAULT 'wire transfer',
    investment_period TEXT DEFAULT '5',
    company_address TEXT DEFAULT '',
    investor_address TEXT DEFAULT '',
    executives TEXT DEFAULT '',
    board TEXT DEFAULT '',
    startup_signature TEXT,
    investor_signature TEXT,
    current_phase INTEGER DEFAULT 1,
    meetings JSONB DEFAULT '[]'::jsonb,
    messages JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AIPredictions Table
CREATE TABLE public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Keep startup_id as TEXT for now to match Deals, or UUID if Startups was generated via Supabase
    -- Because MongoDB used ObjectIDs, string type might be safer for migration compatibility
    startup_id TEXT NOT NULL,
    prediction_date TIMESTAMPTZ DEFAULT now(),
    predicted_metric TEXT NOT NULL,
    predicted_value NUMERIC NOT NULL,
    actual_value NUMERIC,
    verification_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    confidence_score NUMERIC,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AIFeedbacks Table
CREATE TABLE public.ai_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    investor_email TEXT,
    module TEXT NOT NULL,
    context TEXT,
    ai_response TEXT NOT NULL,
    feedback_type TEXT NOT NULL,
    correction TEXT,
    embedding vector(1536),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
