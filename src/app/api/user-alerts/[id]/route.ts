import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Safely check if notification belongs specifically to user
        const { data: notif } = await supabase.from('notifications').select('*').eq('id', id).single();
        
        let updatedData = null;
        if (notif && notif.user_email === user.email) {
            const { data, error } = await supabase.from('notifications')
                .update({ is_read: body.is_read })
                .eq('id', id)
                .select().single();
            if (error) throw error;
            updatedData = data;
        } else {
            updatedData = { ...notif, is_read: body.is_read }; // Mock return for global notifications
        }

        return NextResponse.json({ success: true, data: updatedData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Safely check if notification belongs specifically to user
        const { data: notif } = await supabase.from('notifications').select('*').eq('id', id).single();

        if (notif && notif.user_email === user.email) {
            const { error } = await supabase.from('notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
