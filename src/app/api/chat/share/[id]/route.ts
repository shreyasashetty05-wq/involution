import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = resolvedParams.id;
        
        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || !uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid share ID format." }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        const { data, error } = await supabase
            .from('shared_chats')
            .select('messages, created_at')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error("[Share API GET] Chat not found or DB error:", error);
            return NextResponse.json({ error: "Shared conversation not found." }, { status: 404 });
        }

        return NextResponse.json({
            id,
            messages: data.messages,
            created_at: data.created_at
        }, { status: 200 });

    } catch (error) {
        console.error("[Share API GET] Unhandled error:", error);
        return NextResponse.json(
            { error: "Internal server error retrieving shared chat." }, 
            { status: 500 }
        );
    }
}
