import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Validate: Conversation exists, Messages array isn't empty
        if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            return NextResponse.json(
                { error: "Invalid request: messages array is required and cannot be empty." }, 
                { status: 400 }
            );
        }

        // 2. Security: Generate cryptographically secure IDs using randomUUID
        const shareId = crypto.randomUUID();

        // 3. Save conversation to Supabase
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        const { error } = await supabase
            .from('shared_chats')
            .insert([
                { id: shareId, messages: body.messages }
            ]);

        if (error) {
            console.error("[Share API] Database error:", error);
            return NextResponse.json(
                { error: "Internal server error: Failed to save shared chat." }, 
                { status: 500 }
            );
        }

        // 4. Generate absolute share URL
        const url = new URL(req.url);
        const origin = url.origin;
        const shareUrl = `${origin}/share/${shareId}`;

        return NextResponse.json({ shareId, shareUrl }, { status: 200 });
    } catch (error) {
        console.error("[Share API] Unhandled error:", error);
        return NextResponse.json(
            { error: "Internal server error processing share request." }, 
            { status: 500 }
        );
    }
}
