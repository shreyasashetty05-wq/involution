import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import Startup from "@/database/models/Startup";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Use getServerSession to get the securely logged-in user
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;

        // Find which startups this user owns
        const myStartups = await Startup.find({ ownerEmail: userEmail }).select('_id name').lean();

        if (!myStartups || myStartups.length === 0) {
            return NextResponse.json({ success: true, activeChats: [], executedAgreements: [] });
        }

        // Extract startup IDs (convert ObjectIDs to string to match Deal schema's string representation if needed, 
        // Deal schema shows startupId as String. We should match safely).
        const startupIds = myStartups.map(s => s._id.toString());

        // Find all deals connected to these startups
        const allDeals = await Deal.find({ startupId: { $in: startupIds } }).lean();

        const executedAgreements: any[] = [];
        const activeChats: any[] = [];

        for (const deal of allDeals) {

            // Stats aggregation for Executed deals
            if (deal.status === 'executed') {
                executedAgreements.push({
                    id: deal._id.toString().slice(-6).toUpperCase(),
                    investor: deal.investorId, // Ideally we would lookup investor name, using ID/Email for now
                    date: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : 'N/A',
                    amount: deal.termAmount,
                    equity: deal.termEquity,
                    status: 'Secured'
                });
            }

            // Negotiations handling
            if (deal.status === 'negotiating') {
                let lastMsgText = "No messages yet.";
                let lastMsgTime = "Recently";

                if (deal.messages && deal.messages.length > 0) {
                    const lastMsg = deal.messages[deal.messages.length - 1];
                    lastMsgText = lastMsg.text;
                    lastMsgTime = lastMsg.time || 'Recently';
                }

                activeChats.push({
                    id: deal._id.toString(),
                    startupId: deal.startupId,
                    startupName: deal.startupName,
                    investor: deal.investorId,
                    phase: deal.currentPhase || 1,
                    lastMessage: lastMsgText,
                    time: lastMsgTime,
                    unread: 0
                });
            }
        }

        return NextResponse.json({
            success: true,
            activeChats,
            executedAgreements
        });

    } catch (error: any) {
        console.error("Startup Deals API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
