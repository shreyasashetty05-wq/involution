import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/mongodb";
import { Deal } from "@/database/models/Deal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    
    // In Next.js App Router, params must be awaited if it's dynamic
    const { id: meetingId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const deal = await Deal.findOne({ "meetings._id": meetingId });
        if (!deal) {
            return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
        }

        const meeting = deal.meetings.id(meetingId);
        if (meeting) {
            meeting.status = 'cancelled';
            await deal.save();
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete meeting error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
