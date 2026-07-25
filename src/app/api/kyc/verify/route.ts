import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { verifyKycDocument } from "@/utils/geminiKyc";

/**
 * Handles KYC document verification via Gemini AI before submission.
 */
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as "Aadhaar" | "PAN";

        if (!file || !type) {
            return NextResponse.json({ success: false, error: "Missing file or document type." }, { status: 400 });
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            return NextResponse.json({ success: false, error: "Invalid file type. Only JPG, JPEG, PNG, or WEBP are allowed." }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: "File size exceeds 5MB limit." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        
        const result = await verifyKycDocument(base64Data, file.type, type);

        if (result.valid) {
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: result.reason || `Invalid ${type} document.` }, { status: 400 });
        }

    } catch (error: any) {
        console.error("KYC Verify Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
