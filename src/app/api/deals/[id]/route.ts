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

        // Fetch the deal record
        const { data: record, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
        }

        // 1. Storage Cleanup for the main Deal record (if any)
        const pathsToDelete = extractStoragePaths(record, supabaseUrl);
        const pathsByBucket: Record<string, string[]> = {};
        for (const p of pathsToDelete) {
            if (!pathsByBucket[p.bucket]) pathsByBucket[p.bucket] = [];
            pathsByBucket[p.bucket].push(p.path);
        }

        // Clean up sub-entities (Deal Discussions, Negotiations, Smart Agreements)
        const tablesToClean = ['deal_discussions', 'negotiations', 'negotiation_discussions', 'negotiation_versions', 'smart_agreements'];
        for (const subTable of tablesToClean) {
            const { data: subRecords } = await supabase.from(subTable).select('*').eq('deal_id', id);
            if (subRecords && subRecords.length > 0) {
                const subPaths = extractStoragePaths(subRecords, supabaseUrl);
                for (const p of subPaths) {
                    if (!pathsByBucket[p.bucket]) pathsByBucket[p.bucket] = [];
                    pathsByBucket[p.bucket].push(p.path);
                }
                // We'll let Supabase Cascade delete handle the DB rows if configured, but to be safe:
                await supabase.from(subTable).delete().eq('deal_id', id);
            }
        }

        // Delete all accumulated files across all buckets
        for (const bucket of Object.keys(pathsByBucket)) {
            const paths = pathsByBucket[bucket];
            if (paths.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage.from(bucket).remove(paths);
                if (storageError) {
                    console.error(`Failed to delete storage files for deal ${id} in bucket ${bucket}:`, storageError);
                }
            }
        }

        // 2. Delete database record
        const { error: deleteError } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true, message: `Successfully deleted deal and all associated files.` });
    } catch (error: any) {
        console.error("Delete deal API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
