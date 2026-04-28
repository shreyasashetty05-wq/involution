// Temporary script to seed the database with one AIFeedback item
// so the 'aifeedbacks' collection is created in MongoDB Atlas.
import dbConnect from "@/database/mongodb";
import AIFeedback from "@/database/models/AIFeedback";
import Startup from "@/database/models/Startup";
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Seeds the database with an initial AI feedback record for development use.
 * @example
 * GET(req)
 * { success: true, message: "Successfully created initial aifeedbacks collection item!", feedback: newFeedback }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {NextResponse} A JSON response indicating success or failure.
 **/
export async function GET(req: NextRequest) {
    // Hard block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Seeding is not available in production.' }, { status: 403 });
    }

    try {
        await dbConnect();

        // Find any startup to attach this feedback to
        const startup = await Startup.findOne();
        if (!startup) {
            return NextResponse.json({ success: false, message: "No startups found in DB. Please create one first." }, { status: 400 });
        }

        const textToEmbed = "Context: What is the runway?\nResponse: The runway is 12 months based on a ₹100k burn and ₹1.2M in the bank.";
        const embedRes = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: textToEmbed,
        });

        const newFeedback = await AIFeedback.create({
            startupId: startup._id,
            module: 'chat',
            context: 'What is the runway?',
            aiResponse: 'The runway is 12 months based on a ₹100k burn and ₹1.2M in the bank.',
            feedbackType: 'upvote',
            embedding: embedRes.embeddings && embedRes.embeddings.length > 0 ? embedRes.embeddings[0].values : []
        });

        return NextResponse.json({ success: true, message: "Successfully created initial aifeedbacks collection item!", feedback: newFeedback });

    } catch (error: any) {
        console.error("Error seeding feedback:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
