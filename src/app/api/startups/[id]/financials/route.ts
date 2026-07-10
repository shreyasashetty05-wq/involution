import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Creates a new financial update for a startup owned by the authenticated user.
 * @example
 * POST(req, params)
 * { success: true, data: financialUpdates }
 * @param {Request} req - The incoming request containing the financial update payload.
 * @param {Promise<{ id: string }>} params - Route parameters promise containing the startup id.
 * @returns {Promise<Response>} A Next.js JSON response indicating success or an error status.
 **/
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

        // 1. Locate the Startup. Ensure the user owns it.
        const { data: startup, error: fetchError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", id)
            .eq("owner_email", user.email)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!startup) {
            return NextResponse.json({ success: false, error: 'Startup not found or unauthorized' }, { status: 404 });
        }

        // 2. Extract payload
        const reqReportingType = body.reportingType;
        const reqReportingDate = body.reportingDate;
        const reqRevenue = Number(body.revenue);
        const reqProfit = Number(body.profit);
        const reqNetLoss = body.netLoss ? Number(body.netLoss) : null;
        const reqNotes = body.notes || "";
        const reqDocUrl = body.documentUrl || "";
        const reqAiScore = Number(body.aiConfidenceScore);

        if (!reqReportingType || !reqReportingDate || isNaN(reqRevenue) || isNaN(reqProfit) || isNaN(reqAiScore)) {
            return NextResponse.json({ success: false, error: 'Invalid financial data payload.' }, { status: 400 });
        }

        const currentUpdates = startup.financial_updates || [];

        // 3. Prevent duplicate exact date updates (optional but good practice)
        const updateExists = currentUpdates.some((update: any) => update.reportingDate === reqReportingDate && update.reportingType === reqReportingType);
        if (updateExists) {
            return NextResponse.json({ success: false, error: `An update for ${reqReportingDate} already exists.` }, { status: 400 });
        }

        // 4. Push the new update
        const newUpdate = {
            id: crypto.randomUUID(),
            _id: crypto.randomUUID(),
            monthYear: reqReportingDate, // fallback for legacy
            reportingType: reqReportingType,
            reportingDate: reqReportingDate,
            revenue: reqRevenue,
            profit: reqProfit,
            netLoss: reqNetLoss,
            notes: reqNotes,
            documentUrl: reqDocUrl,
            aiConfidenceScore: reqAiScore,
            status: "Pending",
            documentStatus: reqDocUrl ? "Pending" : null,
            dateSubmitted: new Date().toISOString(),
            verifiedAt: null,
            verifiedBy: null,
            adminRemarks: null
        };

        const updatedUpdates = [...currentUpdates, newUpdate];

        const { error: updateError } = await supabase
            .from("startups")
            .update({ financial_updates: updatedUpdates })
            .eq("id", startup.id);

        if (updateError) throw updateError;

        // Notify Admins
        await supabase.from('notifications').insert({
            role: 'admin',
            type: 'financial_submitted',
            title: "💰 New Financial Update awaiting verification",
            description: `${startup.name} submitted financials for ${reqReportingDate}.`,
            link: `/admin/financial-verification`,
            startup_id: startup.id
        });

        return NextResponse.json({ success: true, data: updatedUpdates }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to post financial update:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
