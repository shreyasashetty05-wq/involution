import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Seeds two sample deal records for the currently authenticated investor in non-production environments.
 * @example
 * GET()
 * { success: true, message: "Successfully seeded 2 deals for Investor: investor123. Go refresh the Dashboard!" }
 * @returns {Promise<NextResponse>} A JSON response indicating success, authorization failure, production blocking, or an internal error.
 **/
export async function GET() {
    // Hard block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Seeding is not available in production.' }, { status: 403 });
    }

    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Please log in to the web app first to seed data for your account.' }, { status: 401 });
        }

        const investorId = user.email || user.id;

        // Create a dummy Executed Deal
        const { error: seed1Error } = await supabase.from("deals").insert({
            startup_id: "dummy-startup-1",
            startup_name: "TechNova Solutions",
            investor_id: investorId,
            status: "executed",
            term_amount: "₹ 75,00,000",
            term_equity: "12.5%",
            current_phase: 5
        });

        if (seed1Error) throw seed1Error;

        // Create a dummy Negotiating Deal with Chat History
        const { error: seed2Error } = await supabase.from("deals").insert({
            startup_id: "dummy-startup-2",
            startup_name: "GreenFuture Energy",
            investor_id: investorId,
            status: "negotiating",
            term_amount: "₹ 1,50,00,000",
            term_equity: "15.0%",
            current_phase: 3,
            messages: [
                { senderId: "startup-founder", text: "We have finalized the term sheet.", time: "Yesterday" },
                { senderId: investorId, text: "Looks good, I will have my lawyers review it and send the final version.", time: "1 hour ago" }
            ]
        });

        if (seed2Error) throw seed2Error;

        return NextResponse.json({ success: true, message: `Successfully seeded 2 deals for Investor: ${investorId}. Go refresh the Dashboard!` });

    } catch (error: any) {
        console.error("Error seeding deals:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
