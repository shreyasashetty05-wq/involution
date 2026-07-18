import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const dealId = req.nextUrl.searchParams.get('dealId');

        if (!dealId) {
            return NextResponse.json({ success: false, error: 'dealId is required' }, { status: 400 });
        }

        // Fetch negotiation
        const { data: negotiation, error: negError } = await supabase
            .from("negotiations")
            .select("*")
            .eq("deal_id", dealId)
            .maybeSingle();

        if (negError) throw negError;

        // Fetch versions
        const { data: versions, error: verError } = await supabase
            .from("negotiation_versions")
            .select("*")
            .eq("deal_id", dealId)
            .order("version_number", { ascending: false });

        if (verError) throw verError;

        let initialTemplate = null;
        if (!versions || versions.length === 0) {
            const { data: deal } = await supabase
                .from("deals")
                .select("startup_id")
                .eq("id", dealId)
                .single();
                
            if (deal?.startup_id) {
                const { data: startup } = await supabase
                    .from("startups")
                    .select("requested, equity, stage")
                    .eq("id", deal.startup_id)
                    .single();
                    
                if (startup) {
                    initialTemplate = {
                        investment_amount: startup.requested || 0,
                        valuation: (startup.requested && startup.equity) ? (startup.requested / (startup.equity / 100)) : 0,
                        equity: startup.equity || 0,
                        investment_type: "Equity",
                        funding_round: startup.stage || "Seed",
                        board_seat: "1",
                        liquidation_preference: "1x Non-Participating",
                        closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    };
                }
            }
        }

        // Fetch discussions
        const { data: discussions, error: discError } = await supabase
            .from("negotiation_discussions")
            .select("*")
            .eq("deal_id", dealId)
            .order("created_at", { ascending: true });

        if (discError) throw discError;

        return NextResponse.json({ 
            success: true, 
            negotiation: negotiation || null,
            versions: versions || [],
            discussions: discussions || [],
            initialTemplate
        });

    } catch (error: any) {
        console.error("Fetch Negotiation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = user.email || user.id;
        
        const body = await req.json();
        const { dealId, action, senderType } = body;

        if (!dealId || !action || !senderType) {
            return NextResponse.json({ success: false, error: 'dealId, action, and senderType are required' }, { status: 400 });
        }

        let { data: negotiation, error: negError } = await supabase
            .from("negotiations")
            .select("*")
            .eq("deal_id", dealId)
            .maybeSingle();

        if (negError) throw negError;

        if (action === 'propose') {
            const { terms } = body;
            
            if (terms.investment_amount < 0 || terms.valuation < 0 || terms.equity <= 0 || terms.equity > 100) {
                return NextResponse.json({ success: false, error: 'Invalid terms values' }, { status: 400 });
            }
            
            // Create negotiation if not exists
            if (!negotiation) {
                const { data: newNeg, error } = await supabase
                    .from("negotiations")
                    .insert({
                        deal_id: dealId,
                        status: senderType === 'startup' ? 'Waiting for Investor' : 'Waiting for Startup'
                    })
                    .select()
                    .single();
                if (error) throw error;
                negotiation = newNeg;
            } else {
                // Update status to Counter Offer Sent
                await supabase
                    .from("negotiations")
                    .update({ status: 'Counter Offer Sent' })
                    .eq("id", negotiation.id);
            }

            // Get latest version number
            const { data: latestVersion, error: vError } = await supabase
                .from("negotiation_versions")
                .select("version_number")
                .eq("deal_id", dealId)
                .order("version_number", { ascending: false })
                .limit(1)
                .maybeSingle();
                
            let nextVersionNumber = 1;
            if (latestVersion && latestVersion.version_number) {
                nextVersionNumber = latestVersion.version_number + 1;
                // update old current version to Countered
                await supabase
                    .from("negotiation_versions")
                    .update({ status: 'Countered' })
                    .eq("deal_id", dealId)
                    .eq("status", "Current");
            }

            if (senderType === 'investor' && nextVersionNumber === 1) {
                return NextResponse.json({ success: false, error: 'Investor cannot create initial offer' }, { status: 403 });
            }

            const { data: newVersion, error: nvError } = await supabase
                .from("negotiation_versions")
                .insert({
                    deal_id: dealId,
                    version_number: nextVersionNumber,
                    proposed_by_type: senderType,
                    proposed_by_id: sessionUserId,
                    investment_amount: terms.investment_amount,
                    valuation: terms.valuation,
                    equity: terms.equity,
                    investment_type: terms.investment_type,
                    funding_round: terms.funding_round,
                    board_seat: terms.board_seat,
                    liquidation_preference: terms.liquidation_preference,
                    closing_date: terms.closing_date,
                    status: 'Current'
                })
                .select()
                .single();
            if (nvError) throw nvError;
            
            return NextResponse.json({ success: true, version: newVersion });

        } else if (action === 'accept') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });
            
            await supabase
                .from("negotiations")
                .update({ status: 'Accepted' })
                .eq("id", negotiation.id);
                
            await supabase
                .from("negotiation_versions")
                .update({ status: 'Accepted' })
                .eq("deal_id", dealId)
                .eq("status", "Current");
                
            return NextResponse.json({ success: true });
            
        } else if (action === 'lock') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });
            
            await supabase
                .from("negotiations")
                .update({ status: 'Locked', is_locked: true })
                .eq("id", negotiation.id);
                
            // Update deal phase to 5
            await supabase
                .from("deals")
                .update({ current_phase: 5 })
                .eq("id", dealId);
                
            return NextResponse.json({ success: true });
            
        } else if (action === 'message') {
            const { message, referencedTerm } = body;
            const { data: newMsg, error: mError } = await supabase
                .from("negotiation_discussions")
                .insert({
                    deal_id: dealId,
                    sender_type: senderType,
                    sender_id: sessionUserId,
                    message,
                    referenced_term: referencedTerm
                })
                .select()
                .single();
            if (mError) throw mError;
            
            return NextResponse.json({ success: true, discussion: newMsg });
            
        } else if (action === 'edit_message') {
            const { messageId, message } = body;
            const { data: msg } = await supabase.from("negotiation_discussions").select("sender_id").eq("id", messageId).single();
            if (msg?.sender_id !== sessionUserId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            
            await supabase.from("negotiation_discussions").update({ message, is_edited: true }).eq("id", messageId);
            return NextResponse.json({ success: true });
            
        } else if (action === 'delete_message') {
            const { messageId } = body;
            const { data: msg } = await supabase.from("negotiation_discussions").select("sender_id").eq("id", messageId).single();
            if (msg?.sender_id !== sessionUserId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            
            await supabase.from("negotiation_discussions").update({ message: "This message was deleted", is_deleted: true }).eq("id", messageId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error("Negotiation Action Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
