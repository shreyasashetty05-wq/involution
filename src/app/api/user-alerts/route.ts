import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('email', user.email).single();
        const role = roleData?.role || 'investor';

        let query = supabase.from('notifications').select('*');
        
        if (role === 'admin') {
            query = query.or(`role.eq.admin,user_email.eq.${user.email}`);
        } else if (role === 'startup' || role === 'incubation') {
            query = query.eq('user_email', user.email);
        } else if (role === 'investor') {
            query = query.or(`role.eq.investor,user_email.eq.${user.email}`);
        }

        const { data: notifications, error } = await query.order('created_at', { ascending: false }).limit(50);

        if (error) throw error;

        return NextResponse.json({ success: true, data: notifications });
    } catch (error: any) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const body = await req.json();
        
        const { data, error } = await supabase.from('notifications').insert({
            user_email: body.user_email || null,
            role: body.role || null,
            type: body.type,
            title: body.title,
            description: body.description || '',
            link: body.link || '',
            startup_id: body.startup_id || null
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Failed to create notification:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'clear_all') {
            const { error } = await supabase.from('notifications').delete().eq('user_email', user.email);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
