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

        // Fetch deal to determine roles securely
        const { data: deal, error: dealError } = await supabase
            .from("deals")
            .select("startup_id, investor_id")
            .eq("id", dealId)
            .single();
            
        if (dealError || !deal) {
            return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
        }

        const sessionUserId = user.email || user.id;
        
        let { data: startupData } = await supabase
            .from("startups")
            .select("owner_email")
            .eq("id", deal.startup_id)
            .maybeSingle();
            
        if (!startupData) {
            const { data: incubeData } = await supabase
                .from("incubation_applications")
                .select("owner_email")
                .eq("id", deal.startup_id)
                .maybeSingle();
            if (incubeData) startupData = incubeData;
        }
            
        const { data: investorData } = await supabase
            .from("investor_profiles")
            .select("email")
            .eq("id", deal.investor_id)
            .single();

        let backendUserRole = 'investor';
        if (startupData?.owner_email === sessionUserId || deal.startup_id === sessionUserId) {
            backendUserRole = 'startup';
        }

        // Fetch negotiation
        let { data: negotiation, error: negError } = await supabase
            .from("negotiations")
            .select("*")
            .eq("deal_id", dealId)
            .maybeSingle();

        if (negError) throw negError;

        // Fetch versions
        let { data: versions, error: verError } = await supabase
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
                let { data: startup } = await supabase
                    .from("startups")
                    .select("requested, equity, stage")
                    .eq("id", deal.startup_id)
                    .maybeSingle();
                    
                if (!startup) {
                    const { data: incube } = await supabase
                        .from("incubation_applications")
                        .select("ask_amount, equity_offered, current_stage")
                        .eq("id", deal.startup_id)
                        .maybeSingle();
                    if (incube) {
                        startup = { requested: incube.ask_amount, equity: incube.equity_offered, stage: incube.current_stage };
                    }
                }
                    
                if (startup) {
                    // Create negotiation if not exists
                    if (!negotiation) {
                        const { data: newNeg, error: negErr } = await supabase
                            .from("negotiations")
                            .insert({
                                deal_id: dealId,
                                status: 'Initial Offer Available'
                            })
                            .select()
                            .single();
                        if (!negErr) {
                            negotiation = newNeg;
                        }
                    } else if (negotiation.status !== 'Initial Offer Available' && (!versions || versions.length === 0)) {
                         await supabase
                            .from("negotiations")
                            .update({ status: 'Initial Offer Available' })
                            .eq("id", negotiation.id);
                         negotiation.status = 'Initial Offer Available';
                    }

                    // Extract user email if needed, but we can just use user_id if auth allows.
                    // For now, let's get the startup owner's user_id. We know deals.startup_id maps to startups.id, but we didn't fetch startups.user_id. Let's fetch it.
                    
                    const { data: stData } = await supabase.from("startups").select("user_id").eq("id", deal.startup_id).maybeSingle();
                    
                    // Automatically create Version 1
                    const calcValuation = (startup.requested && startup.equity) ? (startup.requested / (startup.equity / 100)) : 0;
                    const { data: newVersion, error: vErr } = await supabase
                        .from("negotiation_versions")
                        .insert({
                            deal_id: dealId,
                            version_number: 1,
                            proposed_by_type: 'startup',
                            proposed_by_id: stData?.user_id || user.id, // Fallback to current user
                            investment_amount: startup.requested || 0,
                            valuation: calcValuation,
                            equity: startup.equity || 0,
                            investment_type: "Equity",
                            funding_round: startup.stage || "Seed",
                            board_seat: "1",
                            liquidation_preference: "1x Non-Participating",
                            closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            status: 'Current',
                            action: 'Initial Offer'
                        })
                        .select()
                        .single();
                        
                    if (!vErr) {
                        versions = [newVersion];
                    }
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
            initialTemplate,
            userRole: backendUserRole
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

        // Strictly determine role from backend to prevent frontend sync issues
        let backendSenderType = senderType; // fallback
        const { data: dealCheck } = await supabase.from("deals").select("startup_id, investor_id").eq("id", dealId).maybeSingle();
        if (dealCheck && user.email) {
            let { data: startupData } = await supabase.from("startups").select("owner_email").eq("id", dealCheck.startup_id).maybeSingle();
            if (!startupData) {
                const { data: incubeData } = await supabase.from("incubation_applications").select("owner_email").eq("id", dealCheck.startup_id).maybeSingle();
                if (incubeData) startupData = incubeData;
            }
            const { data: investorData } = await supabase.from("investor_profiles").select("email").eq("id", dealCheck.investor_id).maybeSingle();
            
            if (startupData?.owner_email === user.email) {
                backendSenderType = 'startup';
            } else if (investorData?.email === user.email) {
                backendSenderType = 'investor';
            }
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
                        status: backendSenderType === 'startup' ? 'Waiting for Investor Response' : 'Waiting for Startup Response'
                    })
                    .select()
                    .single();
                if (error) throw error;
                negotiation = newNeg;
            } else {
                // Update status to Counter Offer Sent effectively waiting for other
                const newStatus = backendSenderType === 'startup' ? 'Waiting for Investor Response' : 'Waiting for Startup Response';
                await supabase
                    .from("negotiations")
                    .update({ status: newStatus })
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

            if (backendSenderType === 'investor' && nextVersionNumber === 1) {
                return NextResponse.json({ success: false, error: 'Investor cannot create initial offer' }, { status: 403 });
            }

            const { data: newVersion, error: nvError } = await supabase
                .from("negotiation_versions")
                .insert({
                    deal_id: dealId,
                    version_number: nextVersionNumber,
                    proposed_by_type: backendSenderType,
                    proposed_by_id: sessionUserId,
                    investment_amount: terms.investment_amount,
                    valuation: terms.valuation,
                    equity: terms.equity,
                    investment_type: terms.investment_type,
                    funding_round: terms.funding_round,
                    board_seat: terms.board_seat,
                    liquidation_preference: terms.liquidation_preference,
                    closing_date: terms.closing_date,
                    status: 'Current',
                    action: 'Counter Offer'
                })
                .select()
                .single();
            if (nvError) throw nvError;
            
            // Notify counterparty
            await supabase.from("notifications").insert({
                user_email: null, // Broadcast via role or specific mapping if possible. Let's rely on role for now.
                role: backendSenderType === 'startup' ? 'investor' : 'startup',
                type: 'negotiation',
                title: 'New Counter Offer',
                description: `A new counter offer (v${nextVersionNumber}) has been proposed.`,
                link: `/messages?tab=negotiation&deal=${dealId}`
            });
            
            return NextResponse.json({ success: true, version: newVersion });

        } else if (action === 'accept') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });
            
            // Get current version
            const { data: currentVersion, error: cvError } = await supabase
                .from("negotiation_versions")
                .select("*")
                .eq("deal_id", dealId)
                .eq("status", "Current")
                .single();
                
            if (cvError || !currentVersion) return NextResponse.json({ success: false, error: 'No current version' }, { status: 400 });
            
            // update old current version to Countered
            await supabase
                .from("negotiation_versions")
                .update({ status: 'Countered' })
                .eq("deal_id", dealId)
                .eq("status", "Current");
                
            // Role-based Accept Logic
            const newStatus = backendSenderType === 'startup' ? 'Pending Investor Final Approval' : 'Negotiation Accepted';
            await supabase
                .from("negotiations")
                .update({ status: newStatus })
                .eq("id", negotiation.id);
                
            await supabase
                .from("negotiation_versions")
                .insert({
                    ...currentVersion,
                    id: undefined,
                    created_at: undefined,
                    version_number: currentVersion.version_number + 1,
                    proposed_by_type: backendSenderType,
                    proposed_by_id: sessionUserId,
                    status: 'Current',
                    action: 'Accepted'
                });
                
            await supabase.from("notifications").insert({
                user_email: null,
                role: backendSenderType === 'startup' ? 'investor' : 'startup',
                type: 'negotiation',
                title: backendSenderType === 'startup' ? 'Offer Accepted by Startup' : 'Offer Accepted',
                description: backendSenderType === 'startup' 
                    ? 'The Startup has accepted your Counter Offer! Please proceed to Smart Agreement.' 
                    : 'The proposed investment terms have been accepted! Waiting for Investor to proceed to Phase 5.',
                link: `/messages?tab=negotiation&deal=${dealId}`
            });
                
            return NextResponse.json({ success: true });
            
        } else if (action === 'reject') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });
            
            // Get current version
            const { data: currentVersion } = await supabase
                .from("negotiation_versions")
                .select("*")
                .eq("deal_id", dealId)
                .eq("status", "Current")
                .maybeSingle();
                
            await supabase
                .from("negotiations")
                .update({ status: 'Negotiation Rejected' })
                .eq("id", negotiation.id);
                
            if (currentVersion) {
                await supabase
                    .from("negotiation_versions")
                    .update({ status: 'Countered' })
                    .eq("id", currentVersion.id);
                    
                await supabase
                    .from("negotiation_versions")
                    .insert({
                        ...currentVersion,
                        id: undefined,
                        created_at: undefined,
                        version_number: currentVersion.version_number + 1,
                        proposed_by_type: backendSenderType,
                        proposed_by_id: sessionUserId,
                        status: 'Current',
                        action: 'Rejected'
                    });
            }
                
            await supabase.from("notifications").insert({
                user_email: null,
                role: backendSenderType === 'startup' ? 'investor' : 'startup',
                type: 'negotiation',
                title: 'Offer Rejected',
                description: 'Your proposed investment terms have been rejected. The negotiation has ended.',
                link: `/messages?tab=negotiation&deal=${dealId}`
            });
                
            return NextResponse.json({ success: true });
            
        } else if (action === 'continue') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });

            const newStatus = backendSenderType === 'startup' ? 'Waiting for Startup Response' : 'Waiting for Investor Response';

            await supabase
                .from("deals")
                .update({ status: 'negotiating' })
                .eq("id", dealId);

            await supabase
                .from("negotiations")
                .update({ status: newStatus })
                .eq("id", negotiation.id);
            
            const { data: currentVersion } = await supabase
                .from("negotiation_versions")
                .select("*")
                .eq("deal_id", dealId)
                .eq("status", "Current")
                .maybeSingle();

            if (currentVersion && currentVersion.action === 'Rejected') {
                await supabase.from("negotiation_versions").delete().eq("id", currentVersion.id);
                
                const { data: prevVersion } = await supabase
                    .from("negotiation_versions")
                    .select("id")
                    .eq("deal_id", dealId)
                    .eq("version_number", currentVersion.version_number - 1)
                    .maybeSingle();
                    
                if (prevVersion) {
                    await supabase
                        .from("negotiation_versions")
                        .update({ status: 'Current' })
                        .eq("id", prevVersion.id);
                }
            }
            return NextResponse.json({ success: true });
            
        } else if (action === 'lock') {
            if (!negotiation) return NextResponse.json({ success: false, error: 'No active negotiation' }, { status: 400 });
            
            await supabase
                .from("negotiations")
                .update({ status: 'Negotiation Locked', is_locked: true })
                .eq("id", negotiation.id);
                
            // Update deal phase to 5
            await supabase
                .from("deals")
                .update({ current_phase: 5 })
                .eq("id", dealId);
                
            await supabase.from("notifications").insert({
                role: backendSenderType === 'startup' ? 'investor' : 'startup',
                type: 'negotiation',
                title: 'Negotiation Locked',
                description: 'The negotiation has been locked and moved to Phase 5.',
                link: `/messages?tab=negotiation&deal=${dealId}`
            });
                
            return NextResponse.json({ success: true });
            
        } else if (action === 'message') {
            const { message, referencedTerm } = body;
            const { data: newMsg, error: mError } = await supabase
                .from("negotiation_discussions")
                .insert({
                    deal_id: dealId,
                    sender_type: backendSenderType,
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
