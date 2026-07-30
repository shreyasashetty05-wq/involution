import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { extractStoragePaths, BUCKETS } from '@/utils/storageUtils';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const authHeader = req.headers.get('authorization');
        
        // Vercel Cron sends a Bearer token with the CRON_SECRET.
        // For local manual triggering without a token, we'll allow it if CRON_SECRET is not set, 
        // OR if there's a valid user session.
        if (process.env.CRON_SECRET) {
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        } else {
            // Fallback to checking user session if no CRON_SECRET is configured
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ success: false, error: 'Unauthorized (No CRON_SECRET or User Session)' }, { status: 401 });
            }
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        // Admin client to bypass RLS when deleting files
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch all active records from relevant tables
        const activePaths = new Set<string>();

        const extractFromData = (data: any[]) => {
            if (data && data.length > 0) {
                const paths = extractStoragePaths(data, supabaseUrl);
                for (const p of paths) {
                    activePaths.add(`${p.bucket}/${p.path}`);
                }
            }
        };

        // Startups
        const { data: startups } = await supabase.from('startups').select('*');
        extractFromData(startups || []);

        // Investor Profiles
        const { data: investors } = await supabase.from('investor_profiles').select('*');
        extractFromData(investors || []);

        // Incubation Applications
        const { data: incubations } = await supabase.from('incubation_applications').select('*');
        extractFromData(incubations || []);

        // Deals & Discussions
        const { data: deals } = await supabase.from('deals').select('*');
        extractFromData(deals || []);
        const { data: discussions } = await supabase.from('deal_discussions').select('*');
        extractFromData(discussions || []);

        // Negotiations & Versions & Discussions
        const { data: negotiations } = await supabase.from('negotiations').select('*');
        extractFromData(negotiations || []);
        const { data: negDiscussions } = await supabase.from('negotiation_discussions').select('*');
        extractFromData(negDiscussions || []);
        const { data: negVersions } = await supabase.from('negotiation_versions').select('*');
        extractFromData(negVersions || []);

        // Smart Agreements
        const { data: agreements } = await supabase.from('smart_agreements').select('*');
        extractFromData(agreements || []);

        // KYC Documents (Though stored as base64 right now, check just in case we store URLs later)
        const { data: kycs } = await supabase.from('kyc_documents').select('*');
        extractFromData(kycs || []);

        const deletedFiles: string[] = [];

        // 2. Scan all buckets and delete unreferenced files
        for (const bucket of BUCKETS) {
            // Fetch file list recursively (Supabase JS API .list() with search config or manual recursion)
            // Note: If folders are deeply nested, we might need a recursive list. 
            // We'll do a simple list here which might need enhancement for deep nested folders.
            
            // To recursively list files, we need a recursive function
            const listAllFiles = async (folderPath: string = ''): Promise<string[]> => {
                const { data, error } = await supabaseAdmin.storage.from(bucket).list(folderPath, {
                    limit: 1000,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });

                if (error || !data) {
                    console.error(`Error listing folder ${folderPath} in ${bucket}:`, error);
                    return [];
                }

                let allFiles: string[] = [];
                for (const item of data) {
                    // if item doesn't have an id, it's a folder
                    const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
                    if (!item.id) {
                        const subFiles = await listAllFiles(itemPath);
                        allFiles = allFiles.concat(subFiles);
                    } else if (item.name !== '.emptyFolderPlaceholder') {
                        allFiles.push(itemPath);
                    }
                }
                return allFiles;
            };

            const filesInBucket = await listAllFiles();
            
            // 3. Compare & Clean
            const toDelete: string[] = [];
            for (const file of filesInBucket) {
                const fullPath = `${bucket}/${file}`;
                if (!activePaths.has(fullPath)) {
                    toDelete.push(file);
                }
            }

            if (toDelete.length > 0) {
                const { error } = await supabaseAdmin.storage.from(bucket).remove(toDelete);
                if (error) {
                    console.error(`Failed to delete orphaned files in ${bucket}:`, error);
                } else {
                    deletedFiles.push(...toDelete.map(f => `${bucket}/${f}`));
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${deletedFiles.length} orphaned files.`, 
            deletedFiles 
        });

    } catch (error: any) {
        console.error("Cleanup storage API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
