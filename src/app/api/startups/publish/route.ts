import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from "@/database/mongodb";
import { publishStartup } from "@/backend/services/startupService";

export async function POST(req: Request) {
    try {
        const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET || "inVolution_mock_secret_key_12345" });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const body = await req.json();

        const newStartup = await publishStartup(body, token.email);

        // Fire and forget AI Analysis trigger
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        fetch(`${baseUrl}/api/ai-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startupId: newStartup._id }),
        }).catch(err => console.error("Failed to trigger initial AI Analysis:", err));

        return NextResponse.json({ success: true, data: newStartup }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to publish startup:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
