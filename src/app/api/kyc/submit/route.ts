import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from "@/database/mongodb";
import KYCDocument from "@/database/models/KYCDocument";

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
        const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET || "inVolution_mock_secret_key_12345" });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        await dbConnect();

        // We use req.formData() because we are expecting raw files to be sent
        const formData = await req.formData();

        const aadhaarFile = formData.get('aadhaarFile') as File;
        const panFile = formData.get('panFile') as File;

        if (!aadhaarFile || !panFile) {
            return NextResponse.json({ success: false, error: "Missing identity documents." }, { status: 400 });
        }

        // Convert raw File buffers to Base64 strings for storing in Atlas Document
        const aadhaarBuffer = Buffer.from(await aadhaarFile.arrayBuffer());
        const panBuffer = Buffer.from(await panFile.arrayBuffer());

        // Prefix with Data URI format so frontend can easily render them directly into <img src="..." />
        const aadhaarBase64 = `data:${aadhaarFile.type};base64,${aadhaarBuffer.toString('base64')}`;
        const panBase64 = `data:${panFile.type};base64,${panBuffer.toString('base64')}`;

        // Randomly simulate an OCR matching score algorithm for realism (80-99%)
        const simulatedScore = Math.floor(Math.random() * 20) + 80;

        const kycRecord = await KYCDocument.findOneAndUpdate(
            { email: token.email },
            {
                name: formData.get('name') || "Anonymous User",
                type: formData.get('type') || "Startup Founder",
                aadhaar: formData.get('aadhaar'),
                pan: formData.get('pan'),
                aadhaarFile: aadhaarBase64,
                panFile: panBase64,
                matchScore: simulatedScore,
                status: 'Pending'
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: kycRecord }, { status: 201 });
    } catch (error: any) {
        console.error("KYC Submit Form Failed:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
