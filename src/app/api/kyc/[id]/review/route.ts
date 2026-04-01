import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import KYCDocument from "@/database/models/KYCDocument";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        if (!['Approved', 'Rejected'].includes(body.status)) {
            return NextResponse.json({ success: false, error: "Invalid Verification Action" }, { status: 400 });
        }

        const doc = await KYCDocument.findByIdAndUpdate(id, { status: body.status }, { new: true });

        if (!doc) {
            return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: doc }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Review Execution Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
