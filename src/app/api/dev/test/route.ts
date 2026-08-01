import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase
        .from("incubation_applications")
        .select("id, ai_analysis_score, ai_match_score, ai_strengths, ai_executive_summary, ai_recommendation")
        .eq("id", "256d26a7-1652-4629-8e85-5caa6b82a1e6")
        .single();
        
    return NextResponse.json({ data, error });
}
