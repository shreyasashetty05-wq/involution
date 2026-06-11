import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { publishStartup } from "@/backend/services/startupService";

/**
 * Publishes a startup submission after authenticating the requester, then triggers background AI analysis.
 * @example
 * POST(req)
 * { success: true, data: newStartup }
 * @param {Request} req - Incoming HTTP request containing the startup data in the request body.
 * @returns {Promise<NextResponse>} JSON response indicating success with the created startup, or an error response.
 **/
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (user.user_metadata?.role === "student") {
            body.isStudent = true;
        }

        const newStartup = await publishStartup(supabase, body, user.email);

        // Fire and forget AI Analysis trigger
        const host =
            req.headers.get("x-forwarded-host") ??
            req.headers.get("host") ??
            new URL(req.url).host;
        const proto =
            req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
        fetch(`${baseUrl}/api/ai-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startupId: newStartup.id }),
        }).catch(err => console.error("Failed to trigger initial AI Analysis:", err));

        return NextResponse.json({ success: true, data: newStartup }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to publish startup:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
