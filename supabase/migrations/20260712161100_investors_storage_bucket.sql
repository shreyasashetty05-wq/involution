-- Create investors bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('investors', 'investors', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'investors');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'investors');

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update their own uploads" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'investors');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete their own uploads" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'investors');
