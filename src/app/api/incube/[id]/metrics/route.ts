import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { id } = await params;
        const body = await req.json();
        const action = body.action;
        const delta = body.delta || 1; 

        if (!['view', 'save'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        
        if (!isUuid) {
            return NextResponse.json({ success: true, message: 'Skipped invalid UUID' });
        }

        const { data: incubeApp, error: fetchError } = await supabase
            .from('incubation_applications')
            .select('profile_views, saves_count, id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError || !incubeApp) {
             return NextResponse.json({ success: false, error: 'Incube not found' }, { status: 404 });
        }

        if (action === 'view') {
            const currentViews = incubeApp.profile_views || 0;
            await supabase.from('incubation_applications').update({ profile_views: currentViews + delta }).eq('id', id);
            
            // Also log to startup_profile_views (can reuse same table for incube views if needed)
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                await supabase.from('startup_profile_views').insert({
                    viewer_id: user.email,
                    startup_id: id
                });
            }
        } else if (action === 'save') {
            const currentSaves = incubeApp.saves_count || 0;
            const newSaves = Math.max(0, currentSaves + delta);
            await supabase.from('incubation_applications').update({ saves_count: newSaves }).eq('id', id);
        }

        return NextResponse.json({ success: true, message: 'Metrics updated' });
    } catch (error: any) {
        console.error("[Incube Metrics API] Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
