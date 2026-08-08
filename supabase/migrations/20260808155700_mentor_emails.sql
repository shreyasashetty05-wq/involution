-- Create Mentor Emails Table for RBAC
CREATE TABLE public.mentor_emails (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_emails ENABLE ROW LEVEL SECURITY;

-- Allow users to view if their own email is in the list
CREATE POLICY "Users can view if they are a mentor"
    ON public.mentor_emails
    FOR SELECT
    USING (email = (select email from auth.users where id = auth.uid()));

-- Admins can view all mentor emails
CREATE POLICY "Admins can view all mentor emails"
    ON public.mentor_emails
    FOR SELECT
    USING (
        (SELECT role FROM public.user_roles WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) = 'admin'
    );

-- Insert a default mentor email (You can change this email or add more later)
INSERT INTO public.mentor_emails (email) VALUES ('mentor@involution.com');

