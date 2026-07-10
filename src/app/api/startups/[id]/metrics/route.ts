import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const body = await req.json();
        const { action, delta } = body; // action: 'view', 'save', 'follow'. delta: 1 or -1

        if (!['view', 'save', 'follow'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        // Get current metrics
        const { data: startup, error: fetchError } = await supabase
            .from('startups')
            .select('profile_views, saves_count, followers_count')
            .eq(id.includes('-') ? 'id' : '_id', id)
            .single();

        if (fetchError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const updates: any = {};
        if (action === 'view') {
            updates.profile_views = (Number(startup.profile_views) || 0) + 1;
        } else if (action === 'save') {
            updates.saves_count = Math.max(0, (Number(startup.saves_count) || 0) + (Number(delta) || 1));
        } else if (action === 'follow') {
            updates.followers_count = Math.max(0, (Number(startup.followers_count) || 0) + (Number(delta) || 1));
        }

        const { error: updateError } = await supabase
            .from('startups')
            .update(updates)
            .eq(id.includes('-') ? 'id' : '_id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, updates });
    } catch (error: any) {
        console.error("Failed to update metrics:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
