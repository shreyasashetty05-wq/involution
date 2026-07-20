-- Create Incubation Applications Table for Student Founders
CREATE TABLE public.incubation_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    short_bio TEXT,
    email TEXT NOT NULL,
    phone_number TEXT,
    institution_name TEXT NOT NULL,
    education_level TEXT NOT NULL,
    project_name TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    solution_description TEXT NOT NULL,
    current_stage TEXT NOT NULL,
    equity_offered NUMERIC NOT NULL,
    pitch_videos JSONB DEFAULT '[]'::jsonb,
    additional_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incubation_applications ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own applications
CREATE POLICY "Users can manage their own incubation apps"
    ON public.incubation_applications
    FOR ALL
    USING (owner_email = (auth.jwt() ->> 'email'))
    WITH CHECK (owner_email = (auth.jwt() ->> 'email'));

-- Admins can view all applications
CREATE POLICY "Admins can view all incubation apps"
    ON public.incubation_applications
    FOR SELECT
    USING (
        (SELECT role FROM public.user_roles WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) = 'admin'
    );
