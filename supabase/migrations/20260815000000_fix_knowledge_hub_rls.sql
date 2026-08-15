-- Migration: Fix Knowledge Hub RLS and Seed Categories

-- 1. Fix public.is_admin() to safely extract email from JWT
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  -- Safely extract email from JWT to avoid auth.users RLS issues from storage API context
  jwt_email := auth.jwt() ->> 'email';
  
  -- Fallback in case jwt is missing (e.g. server-side with service role but uid is set)
  IF jwt_email IS NULL THEN
    SELECT email INTO jwt_email FROM auth.users WHERE id = auth.uid();
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = jwt_email 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Safely re-insert the missing Knowledge Hub categories
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
ON CONFLICT (name) DO NOTHING;
