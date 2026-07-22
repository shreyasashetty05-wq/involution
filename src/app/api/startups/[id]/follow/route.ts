import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const action = body.action; 

        if (!['follow', 'unfollow'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        // Check if ID is a valid UUID, otherwise skip startup table updates
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        
        let startup = null;
        if (isUuid) {
            const { data } = await supabase
                .from('startups')
                .select('followers_count, id')
                .eq('id', id)
                .maybeSingle();
            startup = data;
        }

        if (action === 'follow') {
            const { error: insertError } = await supabase
                .from('startup_follows')
                .insert({ investor_email: user.email, startup_id: id });
            
            if (insertError && insertError.code !== '23505') { 
                throw insertError;
            }

            if (isUuid) {
                const currentCount = startup?.followers_count || 0;
                await supabase.from('startups').update({ followers_count: currentCount + 1 }).eq('id', id);
            }

        } else if (action === 'unfollow') {
            await supabase
                .from('startup_follows')
                .delete()
                .eq('investor_email', user.email)
                .eq('startup_id', id);

            if (isUuid) {
                const currentCount = startup?.followers_count || 0;
                const newCount = Math.max(0, currentCount - 1);
                await supabase.from('startups').update({ followers_count: newCount }).eq('id', id);
            }
        }

        return NextResponse.json({ success: true, message: action === 'follow' ? 'Followed successfully' : 'Unfollowed successfully' });
    } catch (error: any) {
        console.error("[Follow API] Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: true, isFollowing: false });
        }

        const { id } = await params;

        const { data, error } = await supabase
            .from('startup_follows')
            .select('id')
            .eq('investor_email', user.email)
            .eq('startup_id', id)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ success: true, isFollowing: !!data });
    } catch (error: any) {
        console.error("[Follow API] GET Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
