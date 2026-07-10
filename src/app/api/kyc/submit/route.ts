import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
* Handles KYC document submission by validating the authenticated user, processing uploaded Aadhaar and PAN files, and storing the record in the database.
* @example
* POST(req)
* { success: true, data: kycRecord }
* @param {Request} req - Incoming request containing form data and uploaded identity documents.
* @returns {Promise<Response>} JSON response indicating success with the saved KYC record or an error status.
**/
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        const formData = await req.formData();

        const aadhaarFile = formData.get('aadhaarFile') as File;
        const panFile = formData.get('panFile') as File;

        if (!aadhaarFile || !panFile) {
            return NextResponse.json({ success: false, error: "Missing identity documents." }, { status: 400 });
        }

        const aadhaarBuffer = Buffer.from(await aadhaarFile.arrayBuffer());
        const panBuffer = Buffer.from(await panFile.arrayBuffer());

        const aadhaarBase64 = `data:${aadhaarFile.type};base64,${aadhaarBuffer.toString('base64')}`;
        const panBase64 = `data:${panFile.type};base64,${panBuffer.toString('base64')}`;

        const simulatedScore = Math.floor(Math.random() * 20) + 80;

        // Check if KYC record already exists for this email
        const { data: existingKyc, error: fetchKycError } = await supabase
            .from("kyc_documents")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();

        if (fetchKycError) throw fetchKycError;

        const kycPayload = {
            email: user.email,
            name: (formData.get('name') as string) || "Anonymous User",
            type: (formData.get('type') as string) || "Startup Founder",
            aadhaar: formData.get('aadhaar') as string,
            pan: formData.get('pan') as string,
            aadhaar_file: aadhaarBase64,
            pan_file: panBase64,
            match_score: simulatedScore,
            status: 'Pending'
        };

        let kycRecord;
        if (existingKyc) {
            const { data, error: updateError } = await supabase
                .from("kyc_documents")
                .update(kycPayload)
                .eq("id", existingKyc.id)
                .select()
                .single();
            if (updateError) throw updateError;
            kycRecord = data;
        } else {
            const { data, error: insertError } = await supabase
                .from("kyc_documents")
                .insert(kycPayload)
                .select()
                .single();
            if (insertError) throw insertError;
            kycRecord = data;
        }

        // Update the user metadata in Supabase Auth
        const { error: metadataError } = await supabase.auth.updateUser({
            data: {
                kycDone: true,
                isNewUser: false,
                kycStatus: 'Pending'
            }
        });

        if (metadataError) {
            console.error("Failed to update user auth metadata:", metadataError);
        }

        // Notify Admins
        await supabase.from('notifications').insert({
            role: 'admin',
            type: 'kyc_submitted',
            title: "📄 New KYC awaiting review",
            description: `${kycPayload.name} submitted their KYC verification.`,
            link: `/admin/kyc`
        });

        // Notify User
        await supabase.from('notifications').insert({
            user_email: user.email,
            type: 'kyc_submitted',
            title: "📄 KYC Submitted Successfully",
            description: "Your KYC documents are under review. We will notify you once verified.",
            link: `/kyc/pending`
        });

        return NextResponse.json({ success: true, data: kycRecord }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Submit Form Failed:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
