import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Run a query to check if we can update the row using anon key
    const { data: fetch1 } = await supabase.from('incubation_applications').select('id, owner_email').limit(1);
    
    return NextResponse.json({
        fetch1
    });
}
