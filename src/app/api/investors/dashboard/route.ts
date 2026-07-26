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
        startupName: deal.startup_name,
        founderName: '',
        lastMessage: lastMsg?.text ?? "No messages yet.",
        time: lastMsg?.time ?? 'Recently',
        unread: 0,
        isRejected: false
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

        const startupIds = activeChats.map(c => c.startupId).filter(Boolean);
        if (startupIds.length > 0) {
            const { data: startupsData } = await supabase
                .from('startups')
                .select('id, basic_info')
                .in('id', startupIds);
            
            const founderMap = (startupsData || []).reduce((acc: any, s: any) => {
                if (s.basic_info && s.basic_info.founderName) {
                    acc[s.id] = s.basic_info.founderName;
                }
                return acc;
            }, {});

            activeChats.forEach(chat => {
                chat.startupName = chat.startup; 
                chat.founderName = founderMap[chat.startupId];
                chat.startup = chat.founderName || chat.startup; 
            });
        }

        const activeChatIds = activeChats.map(c => c.id);
        if (activeChatIds.length > 0) {
            const { data: negotiations } = await supabase
                .from('negotiations')
                .select('deal_id, status')
                .in('deal_id', activeChatIds);
                
            const rejectMap = (negotiations || []).reduce((acc: any, n: any) => {
                if (n.status === 'Negotiation Rejected' || n.status === 'Rejected') {
                    acc[n.deal_id] = true;
                }
                return acc;
            }, {});

            activeChats.forEach(chat => {
                chat.isRejected = rejectMap[chat.id] || false;
            });
        }

        const totalCapitalStr = executedDeals.reduce((sum, d) => sum + parseCapitalAmount(d.term_amount), 0);

        const { data: profileData } = await supabase
            .from('investor_profiles')
            .select('photo_url')
            .eq('email', user.email)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            executedAgreements,
            activeChats,
            profilePhoto: profileData?.photo_url || null,
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
