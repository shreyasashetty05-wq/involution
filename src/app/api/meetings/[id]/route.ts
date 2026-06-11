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
                return { ...m, status: 'cancelled' };
            }
            return m;
        });

        const { error: updateError } = await supabase
            .from("deals")
            .update({ meetings: updatedMeetings })
            .eq("id", targetDeal.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete meeting error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
