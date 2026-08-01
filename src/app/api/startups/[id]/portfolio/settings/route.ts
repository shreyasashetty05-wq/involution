import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { portfolio_status, dismiss_reminder_days } = await req.json();

        const updateData: any = {};
        
        if (portfolio_status) {
            updateData.portfolio_status = portfolio_status;
        }

        if (dismiss_reminder_days) {
            const date = new Date();
            date.setDate(date.getDate() + dismiss_reminder_days);
            updateData.reminder_dismissed_until = date.toISOString();
        }

        const { data, error } = await supabase
            .from("startups")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Failed to update portfolio settings:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
