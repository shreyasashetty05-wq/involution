-- Create shared_chats table
CREATE TABLE IF NOT EXISTS shared_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE shared_chats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to shared chats
CREATE POLICY "Public can view shared chats"
    ON shared_chats FOR SELECT
    USING (true);

-- Allow public insert since we validate at the API layer
CREATE POLICY "Anyone can insert shared chats"
    ON shared_chats FOR INSERT
    WITH CHECK (true);
