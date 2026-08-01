import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(req: Request) {
    try {
        const emailHeader = req.headers.get("x-user-email");
        if (!emailHeader) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch deals that are completed for this investor
        const { data: deals, error: dealsError } = await supabase
            .from("deals")
            .select("startup_id")
            .eq("investor_id", emailHeader)
            .eq("status", "executed");

        if (dealsError) throw dealsError;
        
        // Also check smart_agreements for Deal Completed
        const { data: smartAgreements, error: smartAgreementsError } = await supabase
            .from("smart_agreements")
            .select("startup_id")
            .eq("investor_id", emailHeader)
            .eq("status", "Deal Completed");
            
        if (smartAgreementsError) throw smartAgreementsError;

        const startupIdsSet = new Set([
            ...(deals || []).map(d => d.startup_id),
            ...(smartAgreements || []).map(s => s.startup_id)
        ]);
        
        const startupIds = Array.from(startupIdsSet);

        if (startupIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const { data: startups, error: startupError } = await supabase
            .from("startups")
            .select("*")
            .in("id", startupIds)
            .order("score", { ascending: false });

        if (startupError) throw startupError;

        const startupsList = startups || [];

        // Map fields to camelCase
        const serializedStartups = startupsList.map((doc: any) => ({
            ...doc,
            _id: doc.id,
            ownerEmail: doc.owner_email,
            businessModel: doc.business_model,
            isStudent: doc.is_student,
            portfolioStatus: doc.portfolio_status
        }));

        return NextResponse.json({ success: true, data: serializedStartups });
    } catch (error: any) {
        console.error("Failed to fetch portfolio startups:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
