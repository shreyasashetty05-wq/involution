import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
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
        const { id } = await params;
        const body = await req.json();

        if (!['Approved', 'Rejected'].includes(body.status)) {
            return NextResponse.json({ success: false, error: "Invalid Verification Action" }, { status: 400 });
        }

        const { data: doc, error } = await supabase
            .from("kyc_documents")
            .update({ status: body.status })
            .eq("id", id)
            .select()
            .single();

        if (error || !doc) {
            return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: doc }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Review Execution Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
