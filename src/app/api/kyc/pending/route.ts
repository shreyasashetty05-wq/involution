import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import KYCDocument from "@/database/models/KYCDocument";

export async function GET() {
    try {
        await dbConnect();

        // Fetch only documents awaiting review, ordered by oldest first
        const pending = await KYCDocument.find({ status: 'Pending' }).sort({ createdAt: 1 }).lean();

        // Serialize MongoDB `_id` Obj into a pure String for Client-Side React Rendering 
        const serialized = pending.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString()
        }));

        return NextResponse.json({ success: true, data: serialized }, { status: 200 });
    } catch (error: any) {
        console.error("KYC Pending Fetch Error:", error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
