import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // In Next.js App Router, params must be awaited if it's dynamic
    const { id: meetingId } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse cancellation reason from request body (if provided)
    let cancellationReason = 'No reason provided';
    try {
        const body = await req.json();
        if (body?.reason) cancellationReason = body.reason;
    } catch {
        // No body provided, use default reason
    }

    try {
        const { data: deals, error: fetchError } = await supabase
            .from("deals")
            .select("*");

        if (fetchError) throw fetchError;

        const targetDeal = (deals || []).find((deal: any) => 
            (deal.meetings || []).some((m: any) => m.id === meetingId || m._id === meetingId)
        );

        if (!targetDeal) {
            return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
        }

        const updatedMeetings = (targetDeal.meetings || []).map((m: any) => {
            if (m.id === meetingId || m._id === meetingId) {
                return { 
                    ...m, 
                    status: 'cancelled',
                    cancellationReason,
                    cancelledAt: new Date().toISOString()
                };
            }
            return m;
        });

        const { error: updateError } = await supabase
            .from("deals")
            .update({ meetings: updatedMeetings })
            .eq("id", targetDeal.id);

        if (updateError) throw updateError;

        // Send cancellation notifications to both participants
        try {
            const cancelledMeeting = (targetDeal.meetings || []).find((m: any) => m.id === meetingId || m._id === meetingId);
            const notifBase = {
                type: 'meeting',
                title: 'Meeting Cancelled',
                description: `${cancelledMeeting?.title || 'Meeting'} has been cancelled. Reason: ${cancellationReason}`,
                link: `/messages?startupId=${targetDeal.startup_id}&investorId=${targetDeal.investor_id}&tab=trust`
            };
            // Notify investor
            await supabase.from("notifications").insert({ ...notifBase, user_email: targetDeal.investor_id });
            // Notify startup owner
            const { data: startupData } = await supabase.from("startups").select("owner_email").eq("id", targetDeal.startup_id).maybeSingle();
            if (startupData?.owner_email) {
                await supabase.from("notifications").insert({ ...notifBase, user_email: startupData.owner_email });
            } else {
                const { data: incubeData } = await supabase.from("incubation_applications").select("owner_email").eq("id", targetDeal.startup_id).maybeSingle();
                if (incubeData?.owner_email) {
                    await supabase.from("notifications").insert({ ...notifBase, user_email: incubeData.owner_email });
                }
            }
        } catch (notifErr) {
            console.error("Cancel meeting notification error (non-blocking):", notifErr);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete meeting error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
