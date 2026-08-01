import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This is a one-off script to backfill AI Analysis for existing startups and incubations.
export const maxDuration = 300; // Allows up to 5 minutes on Vercel if deployed there

export async function GET(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl!, supabaseKey!);

        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
        const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;

        // 1. Fetch startups that need analysis
        const { data: startups, error: startupError } = await supabase
            .from("startups")
            .select("id")
            .or('ai_confidence.is.null,ai_score_breakdown.is.null,ai_analysis_score.is.null,ai_analysis_score.eq.0');

        if (startupError) throw startupError;

        // 2. Fetch incubations that need analysis
        const { data: incubations, error: incubeError } = await supabase
            .from("incubation_applications")
            .select("id")
            .or('ai_confidence.is.null,ai_score_breakdown.is.null,ai_analysis_score.is.null,ai_analysis_score.eq.0');

        if (incubeError) throw incubeError;

        const results = {
            startupsProcessed: 0,
            incubationsProcessed: 0,
            errors: [] as string[]
        };

        // We will fire these requests asynchronously so the endpoint doesn't wait too long,
        // but if running locally, we can just await them sequentially.
        
        // Process Startups sequentially to avoid Gemini rate limits
        if (startups && startups.length > 0) {
            for (const startup of startups) {
                try {
                    const res = await fetch(`${baseUrl}/api/ai-analyze`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Cookie': req.headers.get('cookie') || ''
                        },
                        body: JSON.stringify({ type: 'startup', startupId: startup.id })
                    });
                    if (res.ok) {
                        results.startupsProcessed++;
                    } else {
                        results.errors.push(`Startup ${startup.id} failed: ${res.statusText}`);
                    }
                } catch (e: any) {
                    results.errors.push(`Startup ${startup.id} error: ${e.message}`);
                }
                // Delay 1 second to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Process Incubations sequentially
        if (incubations && incubations.length > 0) {
            for (const incube of incubations) {
                try {
                    const res = await fetch(`${baseUrl}/api/ai-analyze`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Cookie': req.headers.get('cookie') || ''
                        },
                        body: JSON.stringify({ type: 'incubation', incubationId: incube.id })
                    });
                    if (res.ok) {
                        results.incubationsProcessed++;
                    } else {
                        results.errors.push(`Incubation ${incube.id} failed: ${res.statusText}`);
                    }
                } catch (e: any) {
                    results.errors.push(`Incubation ${incube.id} error: ${e.message}`);
                }
                // Delay 1 second to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return NextResponse.json({
            success: true,
            message: "Backfill process completed.",
            details: results
        });
    } catch (error: any) {
        console.error("Backfill failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
