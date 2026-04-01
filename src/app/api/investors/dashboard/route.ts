import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
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

        const investorId = session.user.id || session.user.email; // Fallback to email if ID not present

        // Find all deals connected to this investor
        const allDeals = await Deal.find({ investorId }).lean();

        let totalCapitalStr = 0;
        let activeStartups = 0;

        const executedAgreements: any[] = [];
        const activeChats: any[] = [];

        // Parse through deals
        for (const deal of allDeals) {

            // Stats aggregation for Executed deals
            if (deal.status === 'executed') {
                activeStartups++;

                // Parse amount string (e.g. "₹ 50,00,000") to number for aggregation
                const amountMatches = deal.termAmount?.match(/[\d,]+/);
                if (amountMatches) {
                    const num = parseInt(amountMatches[0].replace(/,/g, ''), 10);
                    if (!isNaN(num)) totalCapitalStr += num;
                }

                executedAgreements.push({
                    id: deal._id.toString().slice(-6).toUpperCase(), // Fake Ref ID from Mongo ID
                    startup: deal.startupName,
                    date: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : 'N/A',
                    amount: deal.termAmount,
                    equity: deal.termEquity,
                    status: 'Executed'
                });
            }

            // Negotiations handling
            if (deal.status === 'negotiating') {

                // Find last message
                let lastMsgText = "No messages yet.";
                let lastMsgTime = "Recently";

                if (deal.messages && deal.messages.length > 0) {
                    const lastMsg = deal.messages[deal.messages.length - 1];
                    lastMsgText = lastMsg.text;
                    lastMsgTime = lastMsg.time || 'Recently';
                }

                activeChats.push({
                    id: deal._id.toString(),
                    startupId: deal.startupId || '', // Pass actual startupId for routing
                    startup: deal.startupName,
                    lastMessage: lastMsgText,
                    time: lastMsgTime,
                    unread: 0
                });
            }
        }

        // Format Total Capital (Simplistic formatting for prototype)
        let formattedCapital = "₹ 0";
        if (totalCapitalStr > 10000000) {
            formattedCapital = `₹ ${(totalCapitalStr / 10000000).toFixed(2)}Cr`;
        } else if (totalCapitalStr > 100000) {
            formattedCapital = `₹ ${(totalCapitalStr / 100000).toFixed(2)}L`;
        } else {
            formattedCapital = `₹ ${totalCapitalStr.toLocaleString()}`;
        }

        return NextResponse.json({
            success: true,
            executedAgreements,
            activeChats,
            portfolioStats: {
                totalCapital: formattedCapital,
                activeStartups
            }
        });

    } catch (error: any) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
