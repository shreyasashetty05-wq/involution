import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Retrieves all incubation applications from the database, sorted by ai_match_score in descending order, and returns them as JSON.
 * @example
 * GET()
 * { success: true, data: applications }
 * @returns {Promise<Response>} A JSON response containing the incubation applications data on success, or an error response on failure.
 */
export async function GET(req: Request) {
    try {
        let query = supabase.from("incubation_applications").select("*");

        // Filter only approved applications for discovery? 
        // Or all since it's dev? The original API returned everything, let's return all.

        const { data: applications, error: appsError } = await query.order("ai_match_score", { ascending: false });
        if (appsError) throw appsError;

        const appsList = applications || [];

        // Count executed deals (investors) per incubation idea
        const appIds = appsList.map((doc: any) => doc.id);
        
        let dealCountMap: any = {};
        if (appIds.length > 0) {
            const { data: deals, error: dealsError } = await supabase
                .from("deals")
                .select("startup_id")
                .eq("status", "executed")
                .in("startup_id", appIds);

            if (dealsError) throw dealsError;

            dealCountMap = (deals || []).reduce((acc: any, curr: any) => {
                acc[curr.startup_id] = (acc[curr.startup_id] || 0) + 1;
                return acc;
            }, {});
        }

        // Map fields to match what frontend expects
        const serializedApps = appsList.map((doc: any) => ({
            ...doc,
            _id: doc.id,
            id: doc.id,
            name: doc.project_name,
            sector: doc.industry || "General",
            desc: doc.problem_statement,
            stage: doc.current_stage,
            requested: doc.ask_amount,
            equity: doc.equity_offered,
            score: doc.ai_analysis_timestamp ? doc.ai_analysis_score : doc.ai_match_score,
            investorCount: dealCountMap[doc.id] || 0
        }));

        return NextResponse.json({ success: true, data: serializedApps });
    } catch (error: any) {
        console.error("Failed to fetch incubation ideas:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
