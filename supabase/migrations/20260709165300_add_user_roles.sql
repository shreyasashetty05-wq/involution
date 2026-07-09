-- Create User Roles Table for RBAC
CREATE TABLE public.user_roles (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'investor',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    USING (email = (select email from auth.users where id = auth.uid()));

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (
        (SELECT role FROM public.user_roles WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) = 'admin'
    );
