import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

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
        // Find any startup to attach this feedback to
        const { data: startup, error: startupError } = await supabase
            .from("startups")
            .select("id")
            .limit(1)
            .maybeSingle();

        if (startupError || !startup) {
            return NextResponse.json({ success: false, message: "No startups found in DB. Please create one first." }, { status: 400 });
        }

        const textToEmbed = "Context: What is the runway?\nResponse: The runway is 12 months based on a ₹100k burn and ₹1.2M in the bank.";
        const embedRes = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: textToEmbed,
        });

        const embedding = embedRes.embeddings && embedRes.embeddings.length > 0 ? embedRes.embeddings[0].values : [];

        const { data: newFeedback, error: insertError } = await supabase
            .from("ai_feedbacks")
            .insert({
                startup_id: startup.id.toString(),
                module: 'chat',
                context: 'What is the runway?',
                ai_response: 'The runway is 12 months based on a ₹100k burn and ₹1.2M in the bank.',
                feedback_type: 'upvote',
                embedding: embedding
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: "Successfully created initial aifeedbacks collection item!", feedback: newFeedback });

    } catch (error: any) {
        console.error("Error seeding feedback:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
