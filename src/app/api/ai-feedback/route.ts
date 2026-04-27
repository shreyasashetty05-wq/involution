import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import AIFeedback from "@/database/models/AIFeedback";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
* Handles AI feedback submissions by validating the request body, optionally generating an embedding for upvoted responses, and saving the feedback to the database.
* @example
* POST(req)
* { success: true, feedback: newFeedback }
* @param {NextRequest} req - The incoming Next.js request containing feedback data in the JSON body.
* @returns {Promise<NextResponse>} A JSON response indicating success or failure, with the created feedback on success.
**/
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { startupId, investorEmail, module, context, aiResponse, feedbackType, correction } = body;

        if (!startupId || !module || !aiResponse || !feedbackType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let embedding: number[] | undefined = undefined;

        // Generate embedding if it's an upvote (so we can use it for RAG later)
        if (feedbackType === 'upvote') {
            try {
                const textToEmbed = `Question/Context: ${context || 'General inquiry'}\nResponse: ${aiResponse}`;
                const embedRes = await ai.models.embedContent({
                    model: 'text-embedding-004',
                    contents: textToEmbed,
                });

                if (embedRes.embeddings && embedRes.embeddings.length > 0 && embedRes.embeddings[0].values) {
                    embedding = embedRes.embeddings[0].values;
                }
            } catch (embedError) {
                console.error("Failed to generate embedding for feedback:", embedError);
                // We don't fail the whole request just because embedding failed
            }
        }

        const newFeedback = await AIFeedback.create({
            startupId,
            investorEmail,
            module,
            context,
            aiResponse,
            feedbackType,
            correction,
            embedding
        });

        return NextResponse.json({ success: true, feedback: newFeedback }, { status: 201 });
    } catch (err: any) {
        console.error("AI Feedback Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
