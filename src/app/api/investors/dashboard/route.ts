import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
        id: deal.id.slice(-6).toUpperCase(),
        startup: deal.startup_name,
        date: deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : 'N/A',
        amount: deal.term_amount,
        equity: deal.term_equity,
        status: 'Executed'
    };
}

function buildActiveChat(deal: any) {
    const lastMsg = deal.messages?.at(-1);
    return {
        id: deal.id,
        startupId: deal.startup_id || '',
        startup: deal.startup_name,
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
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const investorId = user.email || user.id;

        const { data: allDeals, error } = await supabase
            .from("deals")
            .select("*")
            .eq("investor_id", investorId);

        if (error) throw error;

        const dealsList = allDeals || [];
        const executedDeals = dealsList.filter(d => d.status === 'executed');
        const executedAgreements = executedDeals.map(buildExecutedAgreement);
        const activeChats = dealsList.filter(d => d.status === 'negotiating').map(buildActiveChat);

        const totalCapitalStr = executedDeals.reduce((sum, d) => sum + parseCapitalAmount(d.term_amount), 0);

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
