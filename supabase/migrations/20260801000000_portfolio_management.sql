-- Add Portfolio Status to Startups
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS portfolio_status TEXT DEFAULT 'Pending Decision' CHECK (portfolio_status IN ('Pending Decision', 'Continue Fundraising', 'Portfolio Management', 'Decide Later')),
ADD COLUMN IF NOT EXISTS reminder_dismissed_until TIMESTAMPTZ;

-- Create Portfolio Updates Table
CREATE TABLE public.portfolio_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    author_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Portfolio Roadmaps Table
CREATE TABLE public.portfolio_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'On Hold', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Portfolio Milestones Table
CREATE TABLE public.portfolio_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID REFERENCES public.portfolio_roadmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date TIMESTAMPTZ,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delayed')),
    completion_percentage INTEGER DEFAULT 0,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Portfolio Directives Table
CREATE TABLE public.portfolio_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    investor_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'In Review', 'Completed', 'Cancelled')),
    assigned_to TEXT,
    activity_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Portfolio Documents Table
CREATE TABLE public.portfolio_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    document_type TEXT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Portfolio Metrics Table
CREATE TABLE public.portfolio_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- e.g., 'Revenue', 'Runway', 'Burn Rate', 'Customer Growth'
    metric_value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
