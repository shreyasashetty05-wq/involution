import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";

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
        await dbConnect();

        // In a real app, this route would be protected (e.g., NextAuth session check)
        // to ensure only the owner of the startup can post KPI updates.

        const { id } = await params;
        const body = await req.json();

        // Find the startup first to ensure it exists
        const startup = await Startup.findById(id);
        if (!startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        // Push the new month's data into the arrays
        startup.financials.months.push(body.month);
        startup.financials.revenue.push(Number(body.revenue));
        startup.financials.netProfit.push(Number(body.netProfit));

        // Update the static current metrics based on the latest submission
        startup.revenue = Number(body.revenue);
        startup.burn = Number(body.revenue) - Number(body.netProfit); // Basic derivation

        // Optionally update CAC/LTV if provided in the form
        if (body.cac) startup.financials.cac = Number(body.cac);
        if (body.ltv) startup.financials.ltv = Number(body.ltv);

        await startup.save();

        return NextResponse.json({ success: true, data: startup }, { status: 200 });
    } catch (error) {
        console.error("Failed to update KPI:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
