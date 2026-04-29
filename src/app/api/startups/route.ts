import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";
import { Deal } from "@/database/models/Deal";

/**
 * Retrieves all startups from the database, sorted by score in descending order, and returns them as JSON.
 * @example
 * GET()
 * { success: true, data: startups }
 * @returns {Promise<Response>} A JSON response containing the startups data on success, or an error response on failure.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        await dbConnect();
        
        let query = {};
        if (type === 'student') {
            query = { isStudent: true };
        } else if (type === 'regular') {
            query = { isStudent: { $ne: true } };
        }

        const startups = await Startup.find(query).sort({ score: -1 }).lean();

        // Count executed deals (investors) per startup
        const startupIds = startups.map((doc: any) => doc._id.toString());
        const deals = await Deal.aggregate([
            { $match: { startupId: { $in: startupIds }, status: 'executed' } },
            { $group: { _id: "$startupId", count: { $sum: 1 } } }
        ]);

        const dealCountMap = deals.reduce((acc: any, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Convert generic MongoDB ObjectIds to strings to prevent Server Component serialization errors
        const serializedStartups = startups.map((doc: any) => ({
            ...doc,
            _id: doc._id.toString(),
            investorCount: dealCountMap[doc._id.toString()] || 0
        }));

        return NextResponse.json({ success: true, data: serializedStartups });
    } catch (error) {
        console.error("Failed to fetch startups:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
