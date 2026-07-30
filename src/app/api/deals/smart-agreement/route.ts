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

        const { data: agreement, error } = await supabase
            .from("smart_agreements")
            .select("*")
            .eq("deal_id", dealId)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ success: true, agreement });

    } catch (error: any) {
        console.error("Fetch Smart Agreement Error:", error);
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
        const { action, dealId, startupId, investorId, signature } = body;

        if (!dealId) {
            return NextResponse.json({ success: false, error: 'dealId is required' }, { status: 400 });
        }

        if (action === 'initialize') {
            const initialLogs = [
                { message: 'Negotiation completed.', time: new Date().toISOString() },
                { message: 'Agreement initialized.', time: new Date().toISOString() }
            ];
            
            const { data: agreement, error } = await supabase
                .from("smart_agreements")
                .insert({
                    deal_id: dealId,
                    startup_id: startupId,
                    investor_id: investorId,
                    status: 'Smart Agreement Started',
                    activity_log: initialLogs
                })
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, agreement });
        }

        // Get the current agreement
        let { data: agreement, error: fetchError } = await supabase
            .from("smart_agreements")
            .select("*")
            .eq("deal_id", dealId)
            .single();

        if (fetchError || !agreement) {
            return NextResponse.json({ success: false, error: 'Smart Agreement not found' }, { status: 404 });
        }

        const now = new Date().toISOString();
        let updateData: any = { updated_at: now };

        const isInvestorAction = sessionUserId === investorId;
        const isStartupAction = !isInvestorAction;

        if (action === 'sign') {
            const currentLogs = agreement.activity_log || [];
            
            if (isStartupAction) {
                updateData.founder_signature = signature;
                updateData.founder_signed_at = now;
                updateData.status = agreement.investor_signature ? 'Signatures Completed' : 'Founder Signed';
                updateData.activity_log = [
                    { message: 'Founder saved signature.', time: now },
                    ...currentLogs
                ];
            } else if (isInvestorAction) {
                if (!agreement.founder_signature) {
                    return NextResponse.json({ success: false, error: 'Investor cannot sign before Founder' }, { status: 400 });
                }
                updateData.investor_signature = signature;
                updateData.investor_signed_at = now;
                updateData.status = agreement.founder_signature ? 'Signatures Completed' : 'Investor Signed';
                updateData.activity_log = [
                    { message: 'Investor saved signature.', time: now },
                    ...currentLogs
                ];
            } else {
                return NextResponse.json({ success: false, error: 'Unauthorized role' }, { status: 403 });
            }
        } else if (action === 'confirm_sent') {
            if (!isInvestorAction) return NextResponse.json({ success: false, error: 'Only investor can confirm payment sent' }, { status: 403 });
            updateData.investor_payment_confirmed = true;
            updateData.investor_payment_confirmed_at = now;
            updateData.status = 'Investor Payment Confirmed';
        } else if (action === 'confirm_received') {
            if (!isStartupAction) return NextResponse.json({ success: false, error: 'Only founder can confirm payment received' }, { status: 403 });
            updateData.startup_payment_received = true;
            updateData.startup_payment_received_at = now;
            updateData.status = 'Deal Completed';
            
            // Wait! If deal is completed, we should probably update the `deals` table too to mark current_phase = 5 (completed), though it's already in Phase 5.
            await supabase.from("deals").update({ status: 'completed' }).eq("id", dealId);
        } else {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        const { data: updatedAgreement, error: updateError } = await supabase
            .from("smart_agreements")
            .update(updateData)
            .eq("id", agreement.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, agreement: updatedAgreement });

    } catch (error: any) {
        console.error("Update Smart Agreement Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
