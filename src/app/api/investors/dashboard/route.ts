import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// --- Helpers ---

function parseCapitalAmount(termAmount: string | undefined): number {
    const match = termAmount?.match(/[\d,]+/);
    if (!match) return 0;
    const num = parseInt(match[0].replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

function formatCapital(total: number): string {
    if (total > 10000000) return `₹ ${(total / 10000000).toFixed(2)}Cr`;
    if (total > 100000) return `₹ ${(total / 100000).toFixed(2)}L`;
    return `₹ ${total.toLocaleString()}`;
}

function buildExecutedAgreement(deal: any) {
    return {
        id: deal._id.toString().slice(-6).toUpperCase(),
        startup: deal.startupName,
        date: deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString() : 'N/A',
        amount: deal.termAmount,
        equity: deal.termEquity,
        status: 'Executed'
    };
}

function buildActiveChat(deal: any) {
    const lastMsg = deal.messages?.at(-1);
    return {
        id: deal._id.toString(),
        startupId: deal.startupId || '',
        startup: deal.startupName,
        lastMessage: lastMsg?.text ?? "No messages yet.",
        time: lastMsg?.time ?? 'Recently',
        unread: 0
    };
}

/**
 * Fetches the authenticated investor's dashboard data, including executed agreements, active negotiation chats, and portfolio statistics.
 * @example
 * GET(req)
 * {
 *   success: true,
 *   executedAgreements: [],
 *   activeChats: [],
 *   portfolioStats: { totalCapital: '₹ 0', activeStartups: 0 }
 * }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A JSON response containing dashboard data or an error response.
 **/
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const investorId = (session.user as any).id || session.user.email;
        const allDeals = await Deal.find({ investorId }).lean();

        const executedDeals = allDeals.filter(d => d.status === 'executed');
        const executedAgreements = executedDeals.map(buildExecutedAgreement);
        const activeChats = allDeals.filter(d => d.status === 'negotiating').map(buildActiveChat);

        const totalCapitalStr = executedDeals.reduce((sum, d) => sum + parseCapitalAmount(d.termAmount), 0);

        return NextResponse.json({
            success: true,
            executedAgreements,
            activeChats,
            portfolioStats: {
                totalCapital: formatCapital(totalCapitalStr),
                activeStartups: executedDeals.length
            }
        });

    } catch (error: any) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

