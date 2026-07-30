import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { extractStoragePaths } from '@/utils/storageUtils';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        // Admin client to bypass RLS when deleting files
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        // Fetch the incubation record
        const { data: record, error: fetchError } = await supabase
            .from('incubation_applications')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return NextResponse.json({ success: false, error: 'Incubation profile not found' }, { status: 404 });
        }

        // 1. Storage Cleanup
        const pathsToDelete = extractStoragePaths(record, supabaseUrl);
        const pathsByBucket: Record<string, string[]> = {};
        for (const p of pathsToDelete) {
            if (!pathsByBucket[p.bucket]) pathsByBucket[p.bucket] = [];
            pathsByBucket[p.bucket].push(p.path);
        }

        for (const bucket of Object.keys(pathsByBucket)) {
            const paths = pathsByBucket[bucket];
            if (paths.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage.from(bucket).remove(paths);
                if (storageError) {
                    console.error(`Failed to delete storage files for incubation ${id} in bucket ${bucket}:`, storageError);
                }
            }
        }

        // 2. Delete database record
        const { error: deleteError } = await supabase
            .from('incubation_applications')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true, message: `Successfully deleted incubation profile and associated files.` });
    } catch (error: any) {
        console.error("Delete incubation API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
