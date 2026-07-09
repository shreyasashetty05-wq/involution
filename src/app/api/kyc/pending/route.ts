import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
* Fetches all pending KYC documents, serializes their IDs, and returns them as a JSON response.
* @example
* GET()
* { success: true, data: [...] }
* @returns {Promise<NextResponse>} A JSON response containing pending KYC documents or an error message.
**/
export async function GET() {
    try {
        const { data: pending, error } = await supabase
            .from("kyc_documents")
            .select("*")
            .eq("status", "Pending")
            .order("created_at", { ascending: true });

        if (error) throw error;

        const serialized = (pending || []).map((doc: any) => ({
            ...doc,
            _id: doc.id,
            aadhaarFile: doc.aadhaar_file,
            panFile: doc.pan_file,
            matchScore: doc.match_score
        }));

        return NextResponse.json({ success: true, data: serialized }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Pending Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
