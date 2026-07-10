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

        // Filter based on role and email
        // If role is admin, they see all 'admin' role notifications + their specific emails
        // If role is investor, they see 'investor' role + their specific emails + followed startups (handled in UI or here? Better here)
        // If role is startup, they see their specific emails
        
        if (role === 'admin') {
            query = query.or(`role.eq.admin,user_email.eq.${user.email}`);
        } else if (role === 'startup') {
            query = query.eq('user_email', user.email);
        } else if (role === 'investor') {
            // Investors might need to see notifications based on startup_id they follow
            // But usually, when an event happens, we log it with user_email for specific people,
            // or we log it globally with role='investor' and startup_id.
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

        // Server-side logging doesn't strictly need user auth if it's called internally, 
        // but it's good practice. Wait, our internal API calls might not carry the cookie if using node-fetch.
        // But since we'll call this from the client or within same-server requests...
        // Let's just insert it.
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
