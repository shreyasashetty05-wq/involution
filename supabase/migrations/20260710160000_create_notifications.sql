-- Create Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT, -- Specific user to notify
    role TEXT, -- Role to broadcast to ('admin', 'investor', 'startup')
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    startup_id UUID, 
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications or notifications for their role
CREATE POLICY "Users can view relevant notifications"
    ON public.notifications
    FOR SELECT
    USING (
        user_email = auth.jwt()->>'email' OR
        role = (select role from public.user_roles where email = auth.jwt()->>'email')
    );

-- Allow inserting notifications (server-side mostly, but auth users can trigger some)
CREATE POLICY "Users can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (
        user_email = auth.jwt()->>'email'
    );

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (
        user_email = auth.jwt()->>'email'
    );
