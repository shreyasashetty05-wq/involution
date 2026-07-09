import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Updates a startup's KPI and financial metrics for a given month.
 * @example
 * POST(req, { params })
 * { success: true, data: startup }
 * @param {Request} req - The incoming request containing KPI data in JSON format.
 * @param {{ params: Promise<{ id: string }> }} context - Route context containing the startup ID.
 * @returns {Promise<Response>} A JSON response indicating success with updated startup data, or an error response.
 **/
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Find the startup first to ensure it exists
        const { data: startup, error: fetchError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const financials = startup.financials || {
            months: [],
            revenue: [],
            netProfit: [],
            roi: 0,
            cac: 0,
            ltv: 0
        };

        // Push the new month's data into the arrays
        const months = [...(financials.months || []), body.month];
        const revenueArr = [...(financials.revenue || []), Number(body.revenue)];
        const netProfit = [...(financials.netProfit || []), Number(body.netProfit)];
        
        let cac = financials.cac || 0;
        let ltv = financials.ltv || 0;

        if (body.cac) cac = Number(body.cac);
        if (body.ltv) ltv = Number(body.ltv);

        const updatedFinancials = {
            ...financials,
            months,
            revenue: revenueArr,
            netProfit,
            cac,
            ltv
        };

        const revenueVal = Number(body.revenue);
        const burnVal = Number(body.revenue) - Number(body.netProfit);

        const { data: updatedStartup, error: updateError } = await supabase
            .from("startups")
            .update({
                financials: updatedFinancials,
                revenue: revenueVal,
                burn: burnVal
            })
            .eq("id", id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, data: updatedStartup }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to update KPI:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
