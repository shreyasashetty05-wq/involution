import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/utils/supabase/server";
import { sendRoleBasedWelcomeEmail } from "@/utils/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Updates the verification status of a KYC document by ID.
 * @example
 * PUT(req, params)
 * { success: true, data: doc }
 * @param {Request} req - Incoming request containing the verification action in the JSON body.
 * @param {{ params: Promise<{ id: string }> }} params - Route parameters promise containing the document ID.
 * @returns {Promise<Response>} A JSON response indicating success, validation failure, not found, or server error.
 **/
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        if (!['Approved', 'Rejected', 'MoreInfo'].includes(body.status)) {
            return NextResponse.json({ success: false, error: "Invalid Verification Action" }, { status: 400 });
        }

        const dbStatus = body.status === 'MoreInfo' ? 'Rejected' : body.status;

        const { data: doc, error } = await supabase
            .from("kyc_documents")
            .update({ status: dbStatus })
            .eq("id", id)
            .select()
            .single();

        if (error || !doc) {
            return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
        }

        let notifTitle = "";
        let notifDesc = "";
        let notifType = "kyc_status";

        if (body.status === 'Approved') {
            notifType = "kyc_approved";
            notifTitle = "✅ Your KYC has been approved";
            notifDesc = "Your identity verification is complete. You can now access all features.";

            // Set the Permanent Verified Name (Full Legal Name)
            if (doc.name) {
                const { error: rpcError } = await supabase.rpc('admin_update_user_name', {
                    target_email: doc.email,
                    new_name: doc.name
                });
                if (rpcError) console.error("Failed to update permanent verified name via RPC:", rpcError);
            }

            // If KYC is approved, update panVerified in startups
            const { data: userStartups } = await supabase
                .from("startups")
                .select("id, credibility")
                .eq("owner_email", doc.email);
            
            if (userStartups) {
                for (const st of userStartups) {
                    await supabase
                        .from("startups")
                        .update({
                            credibility: { ...(st.credibility || {}), panVerified: true }
                        })
                        .eq("id", st.id);
                }
            }

            // Send welcome email if not sent yet
            if (doc.welcome_email_sent !== true) {
                try {
                    const emailSent = await sendRoleBasedWelcomeEmail(doc.email, doc.name || 'User', doc.type || 'Startup Founder');
                    if (emailSent) {
                        // update DB to prevent duplicates
                        await supabase
                            .from("kyc_documents")
                            .update({ welcome_email_sent: true })
                            .eq("id", id);
                    }
                } catch (emailError) {
                    console.error("Non-blocking error: Failed to send welcome email:", emailError);
                }
            }
        } else if (body.status === 'MoreInfo') {
            notifType = "kyc_more_info";
            notifTitle = "⚠️ More Information Requested for KYC";
            notifDesc = body.remarks || "Please update your documents based on the latest feedback.";
        } else if (body.status === 'Rejected') {
            notifType = "kyc_rejected";
            notifTitle = "❌ Your KYC was rejected";
            notifDesc = body.remarks || "Please review your documents and try again.";
        }

        if (notifTitle) {
            await supabase.from('notifications').insert({
                user_email: doc.email,
                role: 'startup', 
                type: notifType,
                title: notifTitle,
                description: notifDesc,
                link: `/kyc/pending`
            });
        }

        return NextResponse.json({ success: true, data: doc }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Review Execution Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
