import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET || "inVolution_mock_secret_key_12345" });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        // 1. Locate the Startup. Ensure the user owns it.
        const startup = await Startup.findOne({ _id: id, ownerEmail: token.email });
        if (!startup) {
            return NextResponse.json({ success: false, error: 'Startup not found or unauthorized' }, { status: 404 });
        }

        // 2. Extract payload
        const reqMonthYear = body.monthYear;
        const reqRevenue = Number(body.revenue);
        const reqProfit = Number(body.profit);
        const reqDocUrl = body.documentUrl || "";
        const reqAiScore = Number(body.aiConfidenceScore);

        if (!reqMonthYear || isNaN(reqRevenue) || isNaN(reqProfit) || isNaN(reqAiScore)) {
            return NextResponse.json({ success: false, error: 'Invalid financial data payload.' }, { status: 400 });
        }

        // 3. Prevent duplicate month updates (optional, but good practice)
        const updateExists = startup.financialUpdates.some((update: any) => update.monthYear === reqMonthYear);
        if (updateExists) {
            return NextResponse.json({ success: false, error: `An update for ${reqMonthYear} already exists.` }, { status: 400 });
        }

        // 4. Push the new update
        startup.financialUpdates.push({
            monthYear: reqMonthYear,
            revenue: reqRevenue,
            profit: reqProfit,
            documentUrl: reqDocUrl,
            aiConfidenceScore: reqAiScore,
            dateSubmitted: new Date()
        });

        await startup.save();

        return NextResponse.json({ success: true, data: startup.financialUpdates }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to post financial update:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
