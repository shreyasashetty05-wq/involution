import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

// --- Helpers ---

function buildExecutedAgreement(deal: any) {
    return {
        id: deal.id.slice(-6).toUpperCase(),
        investor: deal.investor_id,
        date: deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : 'N/A',
        amount: deal.term_amount,
        equity: deal.term_equity,
        status: 'Secured'
    };
}

function buildActiveChat(deal: any) {
    const lastMsg = deal.messages?.at(-1);
    return {
        id: deal.id,
        startupId: deal.startup_id,
        startupName: deal.startup_name,
        investor: deal.investor_id,
        investorName: '',
        investorPhoto: '',
        phase: deal.current_phase || 1,
        lastMessage: lastMsg?.text ?? "No messages yet.",
        time: lastMsg?.time ?? 'Recently',
        unread: 0,
        isRejected: false
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
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const sessionUserEmail = user.email;
        if (!sessionUserEmail) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const { data: myStartups, error: startupsError } = await supabase
            .from("startups")
            .select("id, name")
            .eq("owner_email", sessionUserEmail);

        if (startupsError) throw startupsError;

        if (!myStartups || myStartups.length === 0) {
            return NextResponse.json({ success: true, activeChats: [], executedAgreements: [] });
        }

        const startupIds = myStartups.map(s => s.id);
        const { data: allDeals, error: dealsError } = await supabase
            .from("deals")
            .select("*")
            .in("startup_id", startupIds);

        if (dealsError) throw dealsError;

        const dealsList = allDeals || [];
        const executedAgreements = dealsList
            .filter(d => d.status === 'executed')
            .map(buildExecutedAgreement);

        const activeChats = dealsList
            .filter(d => d.status === 'negotiating')
            .map(buildActiveChat);

        const investorEmails = activeChats.map(c => c.investor);
        if (investorEmails.length > 0) {
            const { data: kycDocs } = await supabase
                .from('kyc_documents')
                .select('email, name')
                .in('email', investorEmails);
            
            const nameMap = (kycDocs || []).reduce((acc: any, doc: any) => {
                acc[doc.email] = doc.name;
                return acc;
            }, {});

            const { data: profiles } = await supabase
                .from('investor_profiles')
                .select('email, photo_url')
                .in('email', investorEmails);
                
            const photoMap = (profiles || []).reduce((acc: any, doc: any) => {
                if (doc.photo_url) acc[doc.email] = doc.photo_url;
                return acc;
            }, {});

            activeChats.forEach(chat => {
                chat.investorName = nameMap[chat.investor] || chat.investor.split('@')[0];
                chat.investorPhoto = photoMap[chat.investor] || '';
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

        return NextResponse.json({ success: true, activeChats, executedAgreements });

    } catch (error: any) {
        console.error("Startup Deals API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
