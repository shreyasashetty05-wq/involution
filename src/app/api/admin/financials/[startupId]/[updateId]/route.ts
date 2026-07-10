import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Updates the status and remarks of a specific financial update for a startup.
 * @example
 * PATCH(req, params)
 * { success: true }
 * @param {Request} req - The incoming request containing the status updates.
 * @param {Promise<{ startupId: string, updateId: string }>} params - Route parameters containing the startup ID and update ID.
 * @returns {Promise<Response>} A Next.js JSON response indicating success or an error status.
 **/
export async function PATCH(req: Request, { params }: { params: Promise<{ startupId: string, updateId: string }> }) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Admin Role
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('email', user.email).maybeSingle();
        if (roleData?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { startupId, updateId } = await params;
        const body = await req.json();
        
        const reqStatus = body.status; // "Pending", "Approved", "Rejected", "Request More Info"
        const reqDocumentStatus = body.documentStatus; // "Pending", "Approved", "Rejected"
        const reqRemarks = body.remarks || "";

        if (!reqStatus) {
            return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 });
        }

        const { data: startup, error: fetchError } = await supabase
            .from("startups")
            .select("financial_updates, owner_email, name")
            .eq("id", startupId)
            .maybeSingle();

        if (fetchError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const currentUpdates = startup.financial_updates || [];
        const updateIndex = currentUpdates.findIndex((u: any) => u.id === updateId || u._id === updateId);

        if (updateIndex === -1) {
            return NextResponse.json({ success: false, error: 'Update not found' }, { status: 404 });
        }

        // Apply changes
        currentUpdates[updateIndex].status = reqStatus;
        if (reqDocumentStatus) {
            currentUpdates[updateIndex].documentStatus = reqDocumentStatus;
        }
        currentUpdates[updateIndex].adminRemarks = reqRemarks;
        currentUpdates[updateIndex].verifiedAt = new Date().toISOString();
        currentUpdates[updateIndex].verifiedBy = user.email;

        const { error: updateError } = await supabase
            .from("startups")
            .update({ financial_updates: currentUpdates })
            .eq("id", startupId);

        if (updateError) throw updateError;

        // Notify Startup and Investors
        let notifTitle = "";
        let notifDesc = "";
        if (reqStatus === 'Approved') {
            notifTitle = "✅ Financial Update Approved";
            notifDesc = "Your monthly report has been verified.";
            
            // Also notify investors
            await supabase.from('notifications').insert({
                role: 'investor',
                type: 'financial_approved',
                title: `📈 ${startup.name} updated its financials`,
                description: `Revenue has been verified and updated.`,
                link: `/startups/${startupId}`,
                startup_id: startupId
            });
        } else if (reqStatus === 'Rejected') {
            notifTitle = "❌ Your financial update was rejected";
            notifDesc = `Reason: ${reqRemarks || 'Please review your submission.'}`;
        } else if (reqStatus === 'Request More Info') {
            notifTitle = "📝 More information required";
            notifDesc = `Reason: ${reqRemarks || 'Please upload missing documents.'}`;
        }

        if (notifTitle) {
            await supabase.from('notifications').insert({
                user_email: startup.owner_email,
                role: 'startup',
                type: 'financial_status',
                title: notifTitle,
                description: notifDesc,
                link: `/startups/dashboard`,
                startup_id: startupId
            });
        }

        return NextResponse.json({ success: true, data: currentUpdates[updateIndex] }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to verify financial update:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
