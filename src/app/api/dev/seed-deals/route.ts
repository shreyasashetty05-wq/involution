import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * Seeds two sample deal records for the currently authenticated investor in non-production environments.
 * @example
 * GET()
 * { success: true, message: "Successfully seeded 2 deals for Investor: investor123. Go refresh the Dashboard!" }
 * @returns {Promise<NextResponse>} A JSON response indicating success, authorization failure, production blocking, or an internal error.
 **/
export async function GET() {
    // Hard block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Seeding is not available in production.' }, { status: 403 });
    }

    try {
        await dbConnect();

        // Use getServerSession to get the securely logged-in user
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Please log in to the web app first to seed data for your account.' }, { status: 401 });
        }

        const investorId = session.user.id || session.user.email;

        // Create a dummy Executed Deal
        await Deal.create({
            startupId: "dummy-startup-1",
            startupName: "TechNova Solutions",
            investorId: investorId,
            status: "executed",
            termAmount: "₹ 75,00,000",
            termEquity: "12.5%",
            currentPhase: 5
        });

        // Create a dummy Negotiating Deal with Chat History
        await Deal.create({
            startupId: "dummy-startup-2",
            startupName: "GreenFuture Energy",
            investorId: investorId,
            status: "negotiating",
            termAmount: "₹ 1,50,00,000",
            termEquity: "15.0%",
            currentPhase: 3,
            messages: [
                { senderId: "startup-founder", text: "We have finalized the term sheet.", time: "Yesterday" },
                { senderId: investorId, text: "Looks good, I will have my lawyers review it and send the final version.", time: "1 hour ago" }
            ]
        });

        return NextResponse.json({ success: true, message: `Successfully seeded 2 deals for Investor: ${investorId}. Go refresh the Dashboard!` });

    } catch (error: any) {
        console.error("Error seeding deals:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

