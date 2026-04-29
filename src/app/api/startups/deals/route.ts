import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import Startup from "@/database/models/Startup";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// --- Helpers ---

function buildExecutedAgreement(deal: any) {
    return {
        id: deal._id.toString().slice(-6).toUpperCase(),
        investor: deal.investorId,
        date: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : 'N/A',
        amount: deal.termAmount,
        equity: deal.termEquity,
        status: 'Secured'
    };
}

function buildActiveChat(deal: any) {
    const lastMsg = deal.messages?.at(-1);
    return {
        id: deal._id.toString(),
        startupId: deal.startupId,
        startupName: deal.startupName,
        investor: deal.investorId,
        phase: deal.currentPhase || 1,
        lastMessage: lastMsg?.text ?? "No messages yet.",
        time: lastMsg?.time ?? 'Recently',
        unread: 0
    };
}

/**
 * Retrieves the authenticated startup owner's active negotiation chats and executed agreements.
 * @example
 * GET(req)
 * { success: true, activeChats: [], executedAgreements: [] }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A JSON response containing the user's active chats and executed agreements, or an error response.
 **/
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const myStartups = await Startup.find({ ownerEmail: session.user.email }).select('_id name').lean();
        if (!myStartups || myStartups.length === 0) {
            return NextResponse.json({ success: true, activeChats: [], executedAgreements: [] });
        }

        const startupIds = myStartups.map(s => s._id.toString());
        const allDeals = await Deal.find({ startupId: { $in: startupIds } }).lean();

        const executedAgreements = allDeals
            .filter(d => d.status === 'executed')
            .map(buildExecutedAgreement);

        const activeChats = allDeals
            .filter(d => d.status === 'negotiating')
            .map(buildActiveChat);

        return NextResponse.json({ success: true, activeChats, executedAgreements });

    } catch (error: any) {
        console.error("Startup Deals API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

