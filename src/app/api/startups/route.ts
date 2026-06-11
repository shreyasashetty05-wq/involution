import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Retrieves all startups from the database, sorted by score in descending order, and returns them as JSON.
 * @example
 * GET()
 * { success: true, data: startups }
 * @returns {Promise<Response>} A JSON response containing the startups data on success, or an error response on failure.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        let query = supabase.from("startups").select("*");
        if (type === 'student') {
            query = query.eq("is_student", true);
        } else if (type === 'regular') {
            query = query.eq("is_student", false);
        }

        const { data: startups, error: startupError } = await query.order("score", { ascending: false });
        if (startupError) throw startupError;

        const startupsList = startups || [];

        // Count executed deals (investors) per startup
        const startupIds = startupsList.map((doc: any) => doc.id);
        
        const { data: deals, error: dealsError } = await supabase
            .from("deals")
            .select("startup_id")
            .eq("status", "executed")
            .in("startup_id", startupIds);

        if (dealsError) throw dealsError;

        const dealCountMap = (deals || []).reduce((acc: any, curr: any) => {
            acc[curr.startup_id] = (acc[curr.startup_id] || 0) + 1;
            return acc;
        }, {});

        // Map fields to camelCase and add investorCount
        const serializedStartups = startupsList.map((doc: any) => ({
            ...doc,
            _id: doc.id,
            ownerEmail: doc.owner_email,
            businessModel: doc.business_model,
            isStudent: doc.is_student,
            founderAge: doc.founder_age,
            financialUpdates: doc.financial_updates,
            basicInfo: doc.basic_info,
            businessInfo: doc.business_info,
            financialsMonthly: doc.financials_monthly,
            financialsYearly: doc.financials_yearly,
            investmentDetails: doc.investment_details,
            growthMetrics: doc.growth_metrics,
            operationalMetrics: doc.operational_metrics,
            credibility: doc.credibility,
            riskDisclosure: doc.risk_disclosure,
            aiReady: doc.ai_ready,
            investorCount: dealCountMap[doc.id] || 0
        }));

        return NextResponse.json({ success: true, data: serializedStartups });
    } catch (error: any) {
        console.error("Failed to fetch startups:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
