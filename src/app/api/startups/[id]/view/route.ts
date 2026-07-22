import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        const { id } = await params;
        const body = await req.json();
        const viewerId = body.viewerId; 

        if (!viewerId) {
            return NextResponse.json({ success: false, error: 'Viewer ID required' }, { status: 400 });
        }

        // Check if viewed recently (within last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentView, error: recentError } = await supabase
            .from('startup_profile_views')
            .select('id')
            .eq('startup_id', id)
            .eq('viewer_id', viewerId)
            .gte('viewed_at', oneHourAgo)
            .maybeSingle();

        if (recentView) {
            // Already viewed recently, don't increment
            return NextResponse.json({ success: true, message: 'View already counted recently' });
        }

        // Insert new view
        await supabase
            .from('startup_profile_views')
            .insert({ viewer_id: viewerId, startup_id: id });

        // Increment profile_views in startups
        const { data: startup } = await supabase
            .from('startups')
            .select('profile_views')
            .eq('id', id)
            .maybeSingle();

        const currentViews = startup?.profile_views || 0;
        await supabase
            .from('startups')
            .update({ profile_views: currentViews + 1 })
            .eq('id', id);

        return NextResponse.json({ success: true, message: 'Profile view recorded' });
    } catch (error: any) {
        console.error("[View API] Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
